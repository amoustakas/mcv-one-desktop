# @mcv/web3-public/oracles

> **Tier 5 — Domain Module · Publishable**
>
> Price feeds, data verification, and oracle infrastructure for MCV ventures on Solana.

---

## Purpose

Oracles are the critical bridge between off-chain real-world data and on-chain smart contracts. Without reliable oracle infrastructure, DeFi protocols operate blind — unable to determine asset prices, verify external events, or trigger conditional logic based on real-world state. The `@mcv/web3-public/oracles` module provides a unified, battle-tested abstraction over multiple oracle providers (Pyth Network, Switchboard, and custom feeds), delivering verified price data and arbitrary off-chain information to every MCV venture that needs it.

This module manages the entire oracle lifecycle: registering and configuring feeds per venture, pulling real-time price data with sub-second latency from Pyth, building custom data feeds for venture-specific use cases (sports odds for BetEdge, property valuations for Futurestate, prediction market resolutions for Axiom), verifying data freshness and confidence intervals, detecting staleness with configurable fallback strategies, aggregating multiple sources for resilience, and storing historical data for analytics and auditing. Every price consumed by an MCV protocol flows through this module's verification pipeline before reaching business logic.

Oracle manipulation is one of the most devastating attack vectors in DeFi — flash loan attacks, stale price exploitation, and single-source manipulation have caused billions in losses across the industry. This module treats security as a first-class concern: multi-source aggregation with outlier rejection, configurable confidence interval enforcement, staleness circuit breakers, deviation threshold alerts, and comprehensive audit logging ensure that MCV ventures consume only verified, fresh, trustworthy data. The module's defense-in-depth approach means that even if one oracle source is compromised, the system detects and mitigates the attack before it reaches downstream consumers.

---

## Exports

```typescript
// === Core Services ===
export { OracleService } from './services/oracle.service';
export { PriceFeedService } from './services/price-feed.service';
export { AggregationService } from './services/aggregation.service';
export { StalenessMonitor } from './services/staleness-monitor.service';
export { CustomFeedService } from './services/custom-feed.service';
export { HistoricalDataService } from './services/historical-data.service';
export { CrossChainPriceService } from './services/cross-chain-price.service';
export { FeedManagementService } from './services/feed-management.service';
export { OracleVerificationService } from './services/oracle-verification.service';

// === Providers ===
export { PythProvider } from './providers/pyth.provider';
export { SwitchboardProvider } from './providers/switchboard.provider';
export { CustomOracleProvider } from './providers/custom-oracle.provider';
export { ChainlinkBridgeProvider } from './providers/chainlink-bridge.provider';

// === Core Interfaces ===
export type {
  OracleConfig,
  PriceFeed,
  PriceFeedConfig,
  DataPoint,
  AggregatedPrice,
  StalenessCheck,
  StalenessAlert,
  AggregationStrategy,
  CustomFeed,
  CustomFeedDefinition,
  FeedRegistration,
  OracleSource,
  ConfidenceInterval,
  DeviationThreshold,
  FallbackStrategy,
  PriceCondition,
  OracleHealthStatus,
  HistoricalQuery,
  HistoricalDataPoint,
  CrossChainPriceRequest,
  FeedMetrics,
} from './interfaces';

// === Enums ===
export {
  OracleProvider,
  FeedStatus,
  AggregationMethod,
  StalenessLevel,
  AlertSeverity,
  PriceConditionType,
  DataPointQuality,
} from './enums';

// === Schemas (Drizzle ORM) ===
export {
  oracleFeeds,
  priceHistory,
  oracleConfigs,
  stalenessAlerts,
  customFeeds,
  feedMetrics,
  oracleAuditLog,
} from './schemas';

// === Error Codes ===
export { OracleErrorCode, OracleError } from './errors';

// === Utilities ===
export { calculateTWAP } from './utils/twap';
export { calculateMedianPrice } from './utils/median';
export { detectOutliers } from './utils/outlier-detection';
export { formatPrice, parsePrice } from './utils/price-format';
export { validateConfidenceInterval } from './utils/confidence';
export { buildPythFeedId, buildSwitchboardFeedId } from './utils/feed-ids';

// === Constants ===
export {
  DEFAULT_STALENESS_THRESHOLD_MS,
  DEFAULT_CONFIDENCE_THRESHOLD,
  DEFAULT_DEVIATION_THRESHOLD_BPS,
  MAX_AGGREGATION_SOURCES,
  PYTH_PROGRAM_IDS,
  SWITCHBOARD_PROGRAM_IDS,
  SUPPORTED_PRICE_PAIRS,
} from './constants';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ORACLE ARCHITECTURE                                    │
│                                                                                  │
│  ┌─────────────────────── External Oracle Sources ───────────────────────┐       │
│  │                                                                       │       │
│  │  ┌──────────────┐  ┌──────────────────┐  ┌─────────────────────┐     │       │
│  │  │ Pyth Network │  │  Switchboard V2  │  │  Custom Data Feeds  │     │       │
│  │  │              │  │                  │  │                     │     │       │
│  │  │ • SOL/USD    │  │ • Custom queues  │  │ • Sports odds       │     │       │
│  │  │ • BTC/USD    │  │ • VRF feeds      │  │ • Property values   │     │       │
│  │  │ • ETH/USD    │  │ • On-demand      │  │ • Prediction data   │     │       │
│  │  │ • 350+ pairs │  │ • Community      │  │ • Venture-specific  │     │       │
│  │  │              │  │                  │  │                     │     │       │
│  │  │ Sub-second   │  │ Configurable     │  │ API-sourced         │     │       │
│  │  │ latency      │  │ update cadence   │  │ verified            │     │       │
│  │  └──────┬───────┘  └────────┬─────────┘  └──────────┬──────────┘     │       │
│  │         │                   │                        │               │       │
│  └─────────┼───────────────────┼────────────────────────┼───────────────┘       │
│            │                   │                        │                        │
│            ▼                   ▼                        ▼                        │
│  ┌─────────────────────────────────────────────────────────────────────┐         │
│  │                      PROVIDER LAYER                                 │         │
│  │                                                                     │         │
│  │  ┌──────────────┐  ┌──────────────────┐  ┌─────────────────────┐   │         │
│  │  │ PythProvider │  │SwitchboardProvider│  │CustomOracleProvider │   │         │
│  │  │              │  │                  │  │                     │   │         │
│  │  │ • Pull model │  │ • Push/pull      │  │ • HTTP fetch        │   │         │
│  │  │ • Hermes API │  │ • Crank-based    │  │ • Signature verify  │   │         │
│  │  │ • Streaming  │  │ • On-demand      │  │ • Schema validate   │   │         │
│  │  └──────┬───────┘  └────────┬─────────┘  └──────────┬──────────┘   │         │
│  │         │                   │                        │             │         │
│  └─────────┼───────────────────┼────────────────────────┼─────────────┘         │
│            │                   │                        │                        │
│            ▼                   ▼                        ▼                        │
│  ┌─────────────────────────────────────────────────────────────────────┐         │
│  │                     AGGREGATION ENGINE                              │         │
│  │                                                                     │         │
│  │  ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │         │
│  │  │   Median   │  │   TWAP   │  │  VWAP    │  │ Outlier Filter  │  │         │
│  │  │ Selection  │  │  Window  │  │  Volume  │  │                 │  │         │
│  │  │            │  │  Based   │  │  Weight  │  │ • Z-score       │  │         │
│  │  │ Pick middle│  │          │  │          │  │ • IQR filter    │  │         │
│  │  │ value from │  │ Smooth   │  │ Weight   │  │ • MAD filter    │  │         │
│  │  │ N sources  │  │ over T   │  │ by vol.  │  │                 │  │         │
│  │  └────────────┘  └──────────┘  └──────────┘  └─────────────────┘  │         │
│  │                                                                     │         │
│  └─────────────────────────────┬───────────────────────────────────────┘         │
│                                │                                                 │
│                                ▼                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐         │
│  │                   VERIFICATION PIPELINE                             │         │
│  │                                                                     │         │
│  │  ┌───────────┐  ┌────────────┐  ┌──────────┐  ┌────────────────┐  │         │
│  │  │ Freshness │  │ Confidence │  │Deviation │  │  Circuit       │  │         │
│  │  │ Check     │  │ Interval   │  │Threshold │  │  Breaker       │  │         │
│  │  │           │  │ Check      │  │ Check    │  │                │  │         │
│  │  │ Is data   │  │            │  │          │  │ Halt if too    │  │         │
│  │  │ < max age?│  │ Spread     │  │ Delta vs │  │ many failures  │  │         │
│  │  │           │  │ within     │  │ last     │  │ or anomalies   │  │         │
│  │  │ Staleness │  │ tolerance? │  │ known    │  │ in window      │  │         │
│  │  │ detection │  │            │  │ price?   │  │                │  │         │
│  │  └─────┬─────┘  └──────┬─────┘  └────┬─────┘  └───────┬────────┘  │         │
│  │        │               │              │                │          │         │
│  │        ▼               ▼              ▼                ▼          │         │
│  │  ┌──────────────────────────────────────────────────────────────┐  │         │
│  │  │              VERIFIED DATA POINT                              │  │         │
│  │  │  { price, confidence, timestamp, quality, sources, proof }   │  │         │
│  │  └──────────────────────────┬───────────────────────────────────┘  │         │
│  │                             │                                      │         │
│  └─────────────────────────────┼──────────────────────────────────────┘         │
│                                │                                                 │
│           ┌────────────────────┼─────────────────────┐                          │
│           │                    │                     │                          │
│           ▼                    ▼                     ▼                          │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐                 │
│  │   Consumers    │  │  Historical     │  │   Alert System   │                 │
│  │                │  │  Storage        │  │                  │                 │
│  │ • DeFi pools   │  │                 │  │ • Staleness      │                 │
│  │ • Token swaps  │  │ • price_history │  │ • Deviation      │                 │
│  │ • Lending      │  │ • Time-series   │  │ • Source failure  │                 │
│  │ • Stop-loss    │  │ • Analytics     │  │ • Circuit break   │                 │
│  │ • Auto-rebal.  │  │ • Backtesting   │  │ • Webhook/email   │                 │
│  └────────────────┘  └─────────────────┘  └──────────────────┘                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Enums

```typescript
/**
 * Supported oracle provider types.
 */
export enum OracleProvider {
  /** Pyth Network — high-frequency, sub-second price feeds */
  PYTH = 'pyth',

  /** Switchboard V2 — customizable, community-driven feeds */
  SWITCHBOARD = 'switchboard',

  /** Custom oracle — venture-specific data feeds */
  CUSTOM = 'custom',

  /** Chainlink bridge — cross-chain price data via Wormhole */
  CHAINLINK_BRIDGE = 'chainlink_bridge',
}

/**
 * Feed lifecycle status.
 */
export enum FeedStatus {
  /** Feed is registered but not yet active */
  PENDING = 'pending',

  /** Feed is active and delivering data */
  ACTIVE = 'active',

  /** Feed is temporarily paused (maintenance, investigation) */
  PAUSED = 'paused',

  /** Feed is stale — no updates within threshold */
  STALE = 'stale',

  /** Feed has been permanently deactivated */
  DEACTIVATED = 'deactivated',

  /** Feed encountered an error and requires attention */
  ERROR = 'error',
}

/**
 * Aggregation methods for combining multiple oracle sources.
 */
export enum AggregationMethod {
  /** Use the median value from all sources */
  MEDIAN = 'median',

  /** Time-Weighted Average Price over a configurable window */
  TWAP = 'twap',

  /** Volume-Weighted Average Price (requires volume data) */
  VWAP = 'vwap',

  /** Simple average of all sources */
  MEAN = 'mean',

  /** Use the single most-trusted source (no aggregation) */
  PRIMARY_FALLBACK = 'primary_fallback',

  /** Weighted average with per-source trust scores */
  WEIGHTED = 'weighted',
}

/**
 * Staleness severity levels.
 */
export enum StalenessLevel {
  /** Data is fresh — within normal update cadence */
  FRESH = 'fresh',

  /** Data is aging — approaching staleness threshold */
  WARNING = 'warning',

  /** Data is stale — exceeds staleness threshold */
  STALE = 'stale',

  /** Data is critically stale — circuit breaker should engage */
  CRITICAL = 'critical',
}

/**
 * Alert severity for oracle events.
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Types of price conditions for oracle-dependent logic.
 */
export enum PriceConditionType {
  /** Price crosses above a threshold */
  ABOVE = 'above',

  /** Price crosses below a threshold */
  BELOW = 'below',

  /** Price deviates more than X% from a reference */
  DEVIATION = 'deviation',

  /** Price changes more than X% in a time window */
  RATE_OF_CHANGE = 'rate_of_change',

  /** Price enters a specified range */
  RANGE_ENTER = 'range_enter',

  /** Price exits a specified range */
  RANGE_EXIT = 'range_exit',
}

/**
 * Quality assessment of a data point after verification.
 */
export enum DataPointQuality {
  /** Verified by multiple sources, high confidence */
  HIGH = 'high',

  /** Verified but with wider confidence interval or fewer sources */
  MEDIUM = 'medium',

  /** Single source or near-stale, use with caution */
  LOW = 'low',

  /** Failed verification — should not be consumed */
  REJECTED = 'rejected',
}
```

---

## Core Interfaces

### OracleConfig

```typescript
/**
 * Top-level oracle configuration for a venture.
 * Each venture gets its own oracle config defining which feeds it needs,
 * how they aggregate, and what staleness/deviation rules apply.
 */
export interface OracleConfig {
  /** Unique config ID */
  id: string;

  /** Venture ID this config belongs to */
  ventureId: string;

  /** Human-readable config name */
  name: string;

  /** Default aggregation method for all feeds unless overridden */
  defaultAggregation: AggregationMethod;

  /** Default staleness threshold in milliseconds */
  defaultStalenessThresholdMs: number;

  /** Default confidence interval threshold (0-1, e.g., 0.95 = 95%) */
  defaultConfidenceThreshold: number;

  /** Default max deviation from last known price in basis points */
  defaultDeviationThresholdBps: number;

  /** Whether to enable circuit breaker globally */
  circuitBreakerEnabled: boolean;

  /** Number of consecutive failures before circuit breaker trips */
  circuitBreakerThreshold: number;

  /** Circuit breaker cooldown period in milliseconds */
  circuitBreakerCooldownMs: number;

  /** Global fallback strategy when primary sources fail */
  fallbackStrategy: FallbackStrategy;

  /** Whether to store all price data to historical tables */
  historicalStorageEnabled: boolean;

  /** Retention period for historical data in days */
  historicalRetentionDays: number;

  /** Registered feeds for this venture */
  feeds: FeedRegistration[];

  /** Created timestamp */
  createdAt: Date;

  /** Last updated timestamp */
  updatedAt: Date;
}
```

### PriceFeed

```typescript
/**
 * Represents a live price feed with current state.
 * This is the runtime representation of a feed — its latest data,
 * health status, and provider connection state.
 */
export interface PriceFeed {
  /** Feed identifier (e.g., "SOL/USD", "BTC/USD") */
  feedId: string;

  /** The trading pair or data identifier */
  pair: string;

  /** Oracle provider for this feed */
  provider: OracleProvider;

  /** Provider-specific feed address or ID */
  providerFeedId: string;

  /** Current feed status */
  status: FeedStatus;

  /** Latest verified data point */
  latestDataPoint: DataPoint | null;

  /** Staleness assessment */
  staleness: StalenessCheck;

  /** Feed-specific configuration overrides */
  config: PriceFeedConfig;

  /** Number of sources currently contributing */
  activeSourceCount: number;

  /** Provider-reported number of publishers (Pyth) or oracles (Switchboard) */
  publisherCount: number;

  /** Last time the feed was successfully updated */
  lastUpdateAt: Date | null;

  /** Last time the feed encountered an error */
  lastErrorAt: Date | null;

  /** Last error message, if any */
  lastError: string | null;

  /** Running metrics for this feed */
  metrics: FeedMetrics;
}
```

### PriceFeedConfig

```typescript
/**
 * Per-feed configuration — overrides venture-level defaults.
 */
export interface PriceFeedConfig {
  /** Override staleness threshold for this specific feed */
  stalenessThresholdMs?: number;

  /** Override confidence threshold for this feed */
  confidenceThreshold?: number;

  /** Override deviation threshold for this feed */
  deviationThresholdBps?: number;

  /** Aggregation method override */
  aggregationMethod?: AggregationMethod;

  /** TWAP window size in seconds (only used if aggregation is TWAP) */
  twapWindowSec?: number;

  /** Minimum number of sources required for valid aggregation */
  minSources?: number;

  /** Maximum age of a data point before it's excluded from aggregation (ms) */
  maxDataPointAgeMs?: number;

  /** Update interval — how often to poll/refresh (ms) */
  updateIntervalMs?: number;

  /** Priority level for update scheduling (higher = more frequent) */
  priority?: number;

  /** Custom tags for categorization and filtering */
  tags?: string[];
}
```

### DataPoint

```typescript
/**
 * A single verified price data point.
 * This is the fundamental unit of oracle data — a timestamped,
 * sourced, confidence-rated observation.
 */
export interface DataPoint {
  /** The feed this data point belongs to */
  feedId: string;

  /** The price value (as a string for precision — use BigNumber/Decimal for math) */
  price: string;

  /** Price as a number (convenience — may lose precision for very large values) */
  priceNumber: number;

  /** Price exponent (Pyth-style: actual_price = price * 10^expo) */
  exponent: number;

  /** Confidence interval — the ± range around the price */
  confidence: ConfidenceInterval;

  /** Timestamp of the data point (from the oracle source, not receipt time) */
  sourceTimestamp: Date;

  /** Timestamp when MCV received and processed this data point */
  receivedTimestamp: Date;

  /** Which provider supplied this data point */
  provider: OracleProvider;

  /** Provider-specific slot or sequence number */
  slot?: number;

  /** Quality assessment after verification */
  quality: DataPointQuality;

  /** Number of publishers/sources that contributed to this value */
  numSources: number;

  /** EMA (exponential moving average) price if available */
  emaPrice?: string;

  /** EMA confidence if available */
  emaConfidence?: string;

  /** Previous price for delta calculations */
  previousPrice?: string;

  /** Status of the underlying oracle account */
  oracleStatus: string;

  /** Raw provider-specific metadata */
  providerMetadata?: Record<string, unknown>;
}
```

### ConfidenceInterval

```typescript
/**
 * Confidence interval around a price data point.
 * Pyth provides this natively; for other providers, it's computed
 * from the spread of contributing sources.
 */
export interface ConfidenceInterval {
  /** The confidence value (± this amount from the price) */
  value: string;

  /** Confidence as a number */
  valueNumber: number;

  /** Confidence as a percentage of the price */
  percentOfPrice: number;

  /** Whether this confidence is within the configured threshold */
  withinThreshold: boolean;

  /** The threshold it was compared against */
  threshold: number;
}
```

### StalenessCheck

```typescript
/**
 * Result of a staleness check on a feed or data point.
 */
export interface StalenessCheck {
  /** The assessed staleness level */
  level: StalenessLevel;

  /** Age of the data in milliseconds */
  ageMs: number;

  /** The threshold that was applied (ms) */
  thresholdMs: number;

  /** Whether the data is considered usable */
  isUsable: boolean;

  /** Human-readable description */
  message: string;

  /** Time until the data becomes stale (ms), or 0 if already stale */
  timeUntilStaleMs: number;

  /** Percentage of staleness threshold consumed (0-100+) */
  stalenessPercent: number;

  /** Recommended action based on staleness */
  recommendedAction: 'use' | 'use_with_caution' | 'fallback' | 'reject';

  /** Timestamp of this check */
  checkedAt: Date;
}
```

### AggregationStrategy

```typescript
/**
 * Defines how multiple oracle sources are combined into a single price.
 */
export interface AggregationStrategy {
  /** Aggregation method to use */
  method: AggregationMethod;

  /** Minimum number of sources required */
  minSources: number;

  /** Maximum number of sources to include */
  maxSources: number;

  /** For TWAP: window size in seconds */
  twapWindowSec?: number;

  /** For VWAP: volume source configuration */
  vwapVolumeSource?: string;

  /** For WEIGHTED: per-source weight assignments */
  sourceWeights?: Record<string, number>;

  /** Outlier detection method */
  outlierDetection: OutlierDetectionConfig;

  /** Whether to prefer more recent data points in aggregation */
  recencyBias: boolean;

  /** Maximum age difference between sources before exclusion (ms) */
  maxAgeSpreadMs: number;
}

/**
 * Configuration for outlier detection in aggregation.
 */
export interface OutlierDetectionConfig {
  /** Whether outlier detection is enabled */
  enabled: boolean;

  /** Detection method */
  method: 'z_score' | 'iqr' | 'mad' | 'none';

  /** Threshold for the detection method (e.g., z-score > 2.5) */
  threshold: number;

  /** Minimum data points required before outlier detection kicks in */
  minDataPoints: number;
}
```

### CustomFeed

```typescript
/**
 * A custom oracle feed for venture-specific data.
 * Custom feeds pull data from external APIs, validate it against
 * a schema, optionally require multiple attestors, and publish
 * the result as an on-chain oracle value.
 */
export interface CustomFeed {
  /** Unique feed ID */
  id: string;

  /** Venture this feed belongs to */
  ventureId: string;

  /** Human-readable name (e.g., "BetEdge NFL Odds", "Futurestate LA Median Home Price") */
  name: string;

  /** Description of what this feed provides */
  description: string;

  /** Feed definition — how to fetch and validate the data */
  definition: CustomFeedDefinition;

  /** Current status */
  status: FeedStatus;

  /** Latest data point */
  latestValue: string | null;

  /** Last successful update */
  lastUpdateAt: Date | null;

  /** Update cadence in milliseconds */
  updateIntervalMs: number;

  /** Number of required attestors (for multi-sig verification) */
  requiredAttestors: number;

  /** Attestor public keys */
  attestorPubkeys: string[];

  /** On-chain account address for this feed (if published) */
  onChainAddress?: string;

  /** Created timestamp */
  createdAt: Date;
}

/**
 * Definition of how a custom feed fetches and validates data.
 */
export interface CustomFeedDefinition {
  /** Data source type */
  sourceType: 'http_api' | 'websocket' | 'graphql' | 'manual';

  /** Source URL or endpoint */
  sourceUrl: string;

  /** HTTP method (for http_api) */
  httpMethod?: 'GET' | 'POST';

  /** Request headers */
  headers?: Record<string, string>;

  /** Request body template (for POST) */
  bodyTemplate?: string;

  /** JSONPath expression to extract the value from the response */
  valuePath: string;

  /** Expected data type of the extracted value */
  valueType: 'number' | 'string' | 'boolean';

  /** JSON schema for response validation */
  responseSchema?: Record<string, unknown>;

  /** Transform function (JavaScript expression) to apply to the extracted value */
  transformExpression?: string;

  /** Decimal places for numeric values */
  decimals?: number;

  /** Authentication configuration */
  auth?: {
    type: 'bearer' | 'api_key' | 'basic' | 'hmac';
    /** Reference to secret in vault (never stored in plain text) */
    secretRef: string;
    /** Header or query param name for api_key auth */
    keyName?: string;
  };

  /** Retry configuration */
  retryConfig?: {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
  };
}
```

### FeedRegistration

```typescript
/**
 * Registration of an oracle feed for a venture.
 * This is the configuration record — what feed to use,
 * which provider, and any per-feed settings.
 */
export interface FeedRegistration {
  /** Registration ID */
  id: string;

  /** The oracle config this belongs to */
  oracleConfigId: string;

  /** Feed identifier (e.g., "SOL/USD") */
  feedId: string;

  /** Display name */
  displayName: string;

  /** Primary oracle provider */
  primaryProvider: OracleProvider;

  /** Primary provider's feed address/ID */
  primaryProviderFeedId: string;

  /** Secondary/backup providers */
  secondaryProviders: Array<{
    provider: OracleProvider;
    providerFeedId: string;
    priority: number;
  }>;

  /** Per-feed config overrides */
  configOverrides: PriceFeedConfig;

  /** Whether this feed is required for the venture to operate */
  isRequired: boolean;

  /** Feed status */
  status: FeedStatus;

  /** Registration timestamp */
  registeredAt: Date;
}
```

### Additional Interfaces

```typescript
/**
 * Deviation threshold configuration.
 */
export interface DeviationThreshold {
  /** Maximum allowed deviation in basis points */
  maxDeviationBps: number;

  /** Reference price to compare against ('last_known' | 'twap' | 'median') */
  referenceSource: 'last_known' | 'twap' | 'median';

  /** Window for reference calculation (seconds) */
  referenceWindowSec: number;

  /** Action when deviation is exceeded */
  onExceed: 'alert' | 'reject' | 'circuit_break';
}

/**
 * Fallback strategy when primary oracle sources fail.
 */
export interface FallbackStrategy {
  /** Type of fallback */
  type: 'secondary_provider' | 'cached_price' | 'twap_fallback' | 'halt';

  /** Maximum age of cached price to use (ms) */
  maxCacheAgeMs?: number;

  /** TWAP window for fallback calculation (seconds) */
  twapFallbackWindowSec?: number;

  /** Whether to alert when fallback is activated */
  alertOnFallback: boolean;

  /** Maximum consecutive fallback uses before halting */
  maxConsecutiveFallbacks?: number;
}

/**
 * Price condition for oracle-dependent business logic.
 */
export interface PriceCondition {
  /** Condition ID */
  id: string;

  /** Feed to monitor */
  feedId: string;

  /** Condition type */
  type: PriceConditionType;

  /** Threshold value (price level or percentage) */
  threshold: string;

  /** For range conditions: upper bound */
  upperBound?: string;

  /** For rate_of_change: window in seconds */
  windowSec?: number;

  /** Callback URL or function to invoke when triggered */
  callbackUrl?: string;

  /** On-chain instruction to execute when triggered */
  onChainAction?: {
    programId: string;
    instruction: string;
    accounts: string[];
  };

  /** Whether this condition is currently armed */
  armed: boolean;

  /** Last time this condition triggered */
  lastTriggeredAt?: Date;

  /** Cooldown between triggers (ms) */
  cooldownMs: number;
}

/**
 * Oracle health status for monitoring dashboards.
 */
export interface OracleHealthStatus {
  /** Overall health assessment */
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';

  /** Number of active feeds */
  activeFeedCount: number;

  /** Number of stale feeds */
  staleFeedCount: number;

  /** Number of errored feeds */
  erroredFeedCount: number;

  /** Circuit breaker state */
  circuitBreakerTripped: boolean;

  /** Active alerts */
  activeAlerts: StalenessAlert[];

  /** Average update latency across all feeds (ms) */
  avgUpdateLatencyMs: number;

  /** Feeds with worst staleness */
  worstFeeds: Array<{
    feedId: string;
    ageMs: number;
    status: FeedStatus;
  }>;

  /** Timestamp of this health check */
  checkedAt: Date;
}

/**
 * Aggregated price — the final output after multi-source aggregation
 * and verification.
 */
export interface AggregatedPrice {
  /** Feed ID */
  feedId: string;

  /** The aggregated price value */
  price: string;

  /** Price as number */
  priceNumber: number;

  /** Aggregation method used */
  method: AggregationMethod;

  /** Number of sources that contributed */
  sourceCount: number;

  /** Individual source data points */
  sources: DataPoint[];

  /** Any sources that were excluded (outliers, stale) */
  excludedSources: Array<{
    dataPoint: DataPoint;
    reason: string;
  }>;

  /** Spread between min and max source prices (bps) */
  spreadBps: number;

  /** Confidence of the aggregated result */
  confidence: ConfidenceInterval;

  /** Staleness of the aggregated result (uses oldest source) */
  staleness: StalenessCheck;

  /** Overall quality assessment */
  quality: DataPointQuality;

  /** Timestamp of aggregation */
  aggregatedAt: Date;
}

/**
 * Historical data query parameters.
 */
export interface HistoricalQuery {
  /** Feed to query */
  feedId: string;

  /** Start of time range */
  from: Date;

  /** End of time range */
  to: Date;

  /** Resolution/granularity */
  resolution: '1s' | '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

  /** Which aggregation to apply to each bucket */
  bucketAggregation: 'first' | 'last' | 'mean' | 'median' | 'ohlc';

  /** Maximum number of data points to return */
  limit?: number;

  /** Only include data points of this quality or better */
  minQuality?: DataPointQuality;
}

/**
 * Historical data point (for query results).
 */
export interface HistoricalDataPoint {
  /** Bucket/period timestamp */
  timestamp: Date;

  /** Open price (first in bucket) */
  open: string;

  /** High price (max in bucket) */
  high: string;

  /** Low price (min in bucket) */
  low: string;

  /** Close price (last in bucket) */
  close: string;

  /** Number of data points in this bucket */
  dataPointCount: number;

  /** Average confidence in this bucket */
  avgConfidence: number;

  /** Dominant quality level in this bucket */
  quality: DataPointQuality;
}

/**
 * Cross-chain price request.
 */
export interface CrossChainPriceRequest {
  /** Asset pair to fetch */
  pair: string;

  /** Source chain */
  sourceChain: 'ethereum' | 'bsc' | 'polygon' | 'arbitrum' | 'avalanche';

  /** Bridge method */
  bridgeMethod: 'wormhole' | 'layerzero' | 'api_bridge';

  /** Maximum acceptable latency (ms) */
  maxLatencyMs: number;

  /** Whether to cache the result */
  cacheResult: boolean;

  /** Cache TTL in milliseconds */
  cacheTtlMs?: number;
}

/**
 * Feed operational metrics.
 */
export interface FeedMetrics {
  /** Total data points received */
  totalDataPoints: number;

  /** Data points received in the last hour */
  dataPointsLastHour: number;

  /** Average update interval observed (ms) */
  avgUpdateIntervalMs: number;

  /** P95 update interval (ms) */
  p95UpdateIntervalMs: number;

  /** Number of staleness events */
  stalenessEvents: number;

  /** Number of rejected data points */
  rejectedDataPoints: number;

  /** Number of circuit breaker trips */
  circuitBreakerTrips: number;

  /** Uptime percentage (0-100) */
  uptimePercent: number;

  /** Average confidence interval width */
  avgConfidenceWidth: number;

  /** Time of the metric window start */
  windowStart: Date;

  /** Time of the metric window end */
  windowEnd: Date;
}

/**
 * Oracle source — a single upstream data source
 * that contributes to a feed.
 */
export interface OracleSource {
  /** Source identifier */
  id: string;

  /** Provider type */
  provider: OracleProvider;

  /** Provider-specific feed ID or address */
  providerFeedId: string;

  /** Trust weight for weighted aggregation (0-1) */
  trustWeight: number;

  /** Whether this source is currently reachable */
  isOnline: boolean;

  /** Average latency from this source (ms) */
  avgLatencyMs: number;

  /** Last successful data point timestamp */
  lastSuccessAt: Date | null;

  /** Consecutive failures count */
  consecutiveFailures: number;
}
```

---

## Database Schemas (Drizzle ORM)

### oracle_feeds

```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  boolean,
  pgEnum,
} from 'drizzle-orm/pg-core';

/**
 * Enum for oracle providers.
 */
export const oracleProviderEnum = pgEnum('oracle_provider', [
  'pyth',
  'switchboard',
  'custom',
  'chainlink_bridge',
]);

/**
 * Enum for feed status.
 */
export const feedStatusEnum = pgEnum('feed_status', [
  'pending',
  'active',
  'paused',
  'stale',
  'deactivated',
  'error',
]);

/**
 * oracle_feeds — Registry of all oracle feeds across ventures.
 *
 * Each row represents a configured feed (e.g., SOL/USD from Pyth)
 * registered for a specific venture. This is the source of truth
 * for what feeds exist and their current operational state.
 */
export const oracleFeeds = pgTable('oracle_feeds', {
  /** Primary key */
  id: uuid('id').primaryKey().defaultRandom(),

  /** Venture that owns this feed */
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  /** Oracle config this feed belongs to */
  oracleConfigId: uuid('oracle_config_id')
    .notNull()
    .references(() => oracleConfigs.id),

  /** Feed identifier (e.g., "SOL/USD", "BTC/USD") */
  feedId: varchar('feed_id', { length: 64 }).notNull(),

  /** Display name */
  displayName: varchar('display_name', { length: 128 }).notNull(),

  /** Primary oracle provider */
  primaryProvider: oracleProviderEnum('primary_provider').notNull(),

  /** Provider-specific feed address or ID */
  primaryProviderFeedId: varchar('primary_provider_feed_id', { length: 256 }).notNull(),

  /** Secondary provider configurations (JSON array) */
  secondaryProviders: jsonb('secondary_providers')
    .notNull()
    .default([]),

  /** Per-feed configuration overrides */
  configOverrides: jsonb('config_overrides')
    .notNull()
    .default({}),

  /** Current feed status */
  status: feedStatusEnum('status').notNull().default('pending'),

  /** Whether this feed is required for venture operation */
  isRequired: boolean('is_required').notNull().default(false),

  /** Latest price value (cached for quick access) */
  latestPrice: varchar('latest_price', { length: 64 }),

  /** Latest price confidence interval */
  latestConfidence: varchar('latest_confidence', { length: 64 }),

  /** Timestamp of the latest price update */
  latestUpdateAt: timestamp('latest_update_at', { withTimezone: true }),

  /** Number of active sources contributing */
  activeSourceCount: integer('active_source_count').notNull().default(0),

  /** Last error message */
  lastError: text('last_error'),

  /** Last error timestamp */
  lastErrorAt: timestamp('last_error_at', { withTimezone: true }),

  /** Running metrics snapshot (JSON) */
  metrics: jsonb('metrics').notNull().default({}),

  /** Created timestamp */
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  /** Updated timestamp */
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

### price_history

```typescript
/**
 * price_history — Time-series storage for all oracle price data.
 *
 * Every verified data point flows into this table. It's optimized
 * for time-range queries, aggregation, and analytics. For high-frequency
 * feeds (Pyth sub-second), consider using TimescaleDB hypertable or
 * partitioning by time.
 *
 * Retention is configurable per venture via oracle_configs.
 */
export const priceHistory = pgTable('price_history', {
  /** Primary key */
  id: uuid('id').primaryKey().defaultRandom(),

  /** Feed this data point belongs to */
  feedId: varchar('feed_id', { length: 64 }).notNull(),

  /** Venture context */
  ventureId: uuid('venture_id').notNull(),

  /** Price value (string for precision) */
  price: varchar('price', { length: 64 }).notNull(),

  /** Price exponent (Pyth-style) */
  exponent: integer('exponent').notNull().default(0),

  /** Confidence interval value */
  confidence: varchar('confidence', { length: 64 }),

  /** Confidence as percentage of price */
  confidencePercent: varchar('confidence_percent', { length: 16 }),

  /** EMA price if available */
  emaPrice: varchar('ema_price', { length: 64 }),

  /** Oracle provider that supplied this data */
  provider: oracleProviderEnum('provider').notNull(),

  /** Provider-specific slot or sequence number */
  slot: integer('slot'),

  /** Quality assessment */
  quality: varchar('quality', { length: 16 }).notNull().default('medium'),

  /** Number of sources/publishers */
  numSources: integer('num_sources').notNull().default(1),

  /** Timestamp from the oracle source */
  sourceTimestamp: timestamp('source_timestamp', { withTimezone: true }).notNull(),

  /** Timestamp when MCV received this data point */
  receivedTimestamp: timestamp('received_timestamp', { withTimezone: true })
    .notNull()
    .defaultNow(),

  /** Aggregation method used (if aggregated from multiple sources) */
  aggregationMethod: varchar('aggregation_method', { length: 32 }),

  /** Number of sources in aggregation */
  aggregationSourceCount: integer('aggregation_source_count'),

  /** Spread between sources in basis points */
  aggregationSpreadBps: integer('aggregation_spread_bps'),

  /** Raw provider metadata (JSON) */
  providerMetadata: jsonb('provider_metadata'),
});

// Indexes for efficient time-range queries
// CREATE INDEX idx_price_history_feed_time ON price_history (feed_id, source_timestamp DESC);
// CREATE INDEX idx_price_history_venture_time ON price_history (venture_id, source_timestamp DESC);
// CREATE INDEX idx_price_history_feed_received ON price_history (feed_id, received_timestamp DESC);
```

### oracle_configs

```typescript
/**
 * oracle_configs — Per-venture oracle configuration.
 *
 * Stores the venture-level defaults for staleness thresholds,
 * aggregation methods, circuit breaker settings, and more.
 * Individual feeds can override these via their configOverrides.
 */
export const oracleConfigs = pgTable('oracle_configs', {
  /** Primary key */
  id: uuid('id').primaryKey().defaultRandom(),

  /** Venture this config belongs to */
  ventureId: uuid('venture_id').notNull().unique(),

  /** Human-readable config name */
  name: varchar('name', { length: 128 }).notNull(),

  /** Default aggregation method */
  defaultAggregation: varchar('default_aggregation', { length: 32 })
    .notNull()
    .default('median'),

  /** Default staleness threshold in milliseconds */
  defaultStalenessThresholdMs: integer('default_staleness_threshold_ms')
    .notNull()
    .default(30000),

  /** Default confidence interval threshold (stored as basis points, e.g., 9500 = 95%) */
  defaultConfidenceThresholdBps: integer('default_confidence_threshold_bps')
    .notNull()
    .default(9500),

  /** Default max deviation in basis points */
  defaultDeviationThresholdBps: integer('default_deviation_threshold_bps')
    .notNull()
    .default(500),

  /** Whether circuit breaker is enabled */
  circuitBreakerEnabled: boolean('circuit_breaker_enabled')
    .notNull()
    .default(true),

  /** Consecutive failures before circuit breaker trips */
  circuitBreakerThreshold: integer('circuit_breaker_threshold')
    .notNull()
    .default(5),

  /** Circuit breaker cooldown in milliseconds */
  circuitBreakerCooldownMs: integer('circuit_breaker_cooldown_ms')
    .notNull()
    .default(60000),

  /** Fallback strategy configuration (JSON) */
  fallbackStrategy: jsonb('fallback_strategy')
    .notNull()
    .default({
      type: 'cached_price',
      maxCacheAgeMs: 120000,
      alertOnFallback: true,
      maxConsecutiveFallbacks: 10,
    }),

  /** Whether to store historical price data */
  historicalStorageEnabled: boolean('historical_storage_enabled')
    .notNull()
    .default(true),

  /** Retention period for historical data (days) */
  historicalRetentionDays: integer('historical_retention_days')
    .notNull()
    .default(90),

  /** Additional config (JSON — extensible) */
  additionalConfig: jsonb('additional_config')
    .notNull()
    .default({}),

  /** Created timestamp */
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  /** Updated timestamp */
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

### staleness_alerts

```typescript
/**
 * Enum for alert severity.
 */
export const alertSeverityEnum = pgEnum('alert_severity', [
  'info',
  'warning',
  'error',
  'critical',
]);

/**
 * staleness_alerts — Log of staleness events and oracle alerts.
 *
 * Every time a feed becomes stale, a deviation threshold is breached,
 * a circuit breaker trips, or any other oracle anomaly is detected,
 * an alert is recorded here. Used for monitoring, incident response,
 * and post-mortem analysis.
 */
export const stalenessAlerts = pgTable('staleness_alerts', {
  /** Primary key */
  id: uuid('id').primaryKey().defaultRandom(),

  /** Feed that triggered the alert */
  feedId: varchar('feed_id', { length: 64 }).notNull(),

  /** Venture context */
  ventureId: uuid('venture_id').notNull(),

  /** Alert severity */
  severity: alertSeverityEnum('severity').notNull(),

  /** Alert type */
  alertType: varchar('alert_type', { length: 64 }).notNull(),

  /** Human-readable alert message */
  message: text('message').notNull(),

  /** Detailed context (JSON) */
  context: jsonb('context').notNull().default({}),

  /** The data age at the time of the alert (ms) */
  dataAgeMs: integer('data_age_ms'),

  /** The threshold that was breached (ms or bps depending on type) */
  thresholdValue: integer('threshold_value'),

  /** The actual value that triggered the breach */
  actualValue: varchar('actual_value', { length: 64 }),

  /** Whether this alert has been acknowledged */
  acknowledged: boolean('acknowledged').notNull().default(false),

  /** Who/what acknowledged it */
  acknowledgedBy: varchar('acknowledged_by', { length: 128 }),

  /** When it was acknowledged */
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),

  /** Whether this alert has been resolved */
  resolved: boolean('resolved').notNull().default(false),

  /** Resolution timestamp */
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),

  /** Resolution notes */
  resolutionNotes: text('resolution_notes'),

  /** Alert created timestamp */
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Indexes
// CREATE INDEX idx_staleness_alerts_feed ON staleness_alerts (feed_id, created_at DESC);
// CREATE INDEX idx_staleness_alerts_venture ON staleness_alerts (venture_id, created_at DESC);
// CREATE INDEX idx_staleness_alerts_unresolved ON staleness_alerts (resolved, severity) WHERE resolved = false;
```

### custom_feeds

```typescript
/**
 * custom_feeds — Venture-specific custom oracle feeds.
 *
 * For data that doesn't come from standard oracle providers — sports odds,
 * property valuations, prediction market outcomes, and other
 * venture-specific information. Each custom feed defines its data source,
 * extraction path, validation schema, and attestor requirements.
 */
export const customFeeds = pgTable('custom_feeds', {
  /** Primary key */
  id: uuid('id').primaryKey().defaultRandom(),

  /** Venture that owns this feed */
  ventureId: uuid('venture_id').notNull(),

  /** Human-readable name */
  name: varchar('name', { length: 128 }).notNull(),

  /** Description */
  description: text('description'),

  /** Feed definition (JSON — CustomFeedDefinition) */
  definition: jsonb('definition').notNull(),

  /** Current status */
  status: feedStatusEnum('status').notNull().default('pending'),

  /** Latest value */
  latestValue: varchar('latest_value', { length: 256 }),

  /** Latest update timestamp */
  latestUpdateAt: timestamp('latest_update_at', { withTimezone: true }),

  /** Update interval in milliseconds */
  updateIntervalMs: integer('update_interval_ms')
    .notNull()
    .default(60000),

  /** Number of required attestors for verification */
  requiredAttestors: integer('required_attestors')
    .notNull()
    .default(1),

  /** Attestor public keys (JSON array of strings) */
  attestorPubkeys: jsonb('attestor_pubkeys')
    .notNull()
    .default([]),

  /** On-chain account address (if published to Solana) */
  onChainAddress: varchar('on_chain_address', { length: 64 }),

  /** Error count (consecutive) */
  consecutiveErrors: integer('consecutive_errors')
    .notNull()
    .default(0),

  /** Last error message */
  lastError: text('last_error'),

  /** Last error timestamp */
  lastErrorAt: timestamp('last_error_at', { withTimezone: true }),

  /** Created timestamp */
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  /** Updated timestamp */
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

### feed_metrics

```typescript
/**
 * feed_metrics — Periodic snapshots of feed operational metrics.
 *
 * Captured at regular intervals (e.g., every 5 minutes) for dashboards,
 * alerting, and SLA tracking. Separate from the real-time metrics
 * held in memory by the feed service.
 */
export const feedMetrics = pgTable('feed_metrics', {
  /** Primary key */
  id: uuid('id').primaryKey().defaultRandom(),

  /** Feed ID */
  feedId: varchar('feed_id', { length: 64 }).notNull(),

  /** Venture context */
  ventureId: uuid('venture_id').notNull(),

  /** Window start time */
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),

  /** Window end time */
  windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),

  /** Total data points in this window */
  totalDataPoints: integer('total_data_points').notNull().default(0),

  /** Rejected data points in this window */
  rejectedDataPoints: integer('rejected_data_points').notNull().default(0),

  /** Average update interval observed (ms) */
  avgUpdateIntervalMs: integer('avg_update_interval_ms'),

  /** P95 update interval (ms) */
  p95UpdateIntervalMs: integer('p95_update_interval_ms'),

  /** Staleness events in this window */
  stalenessEvents: integer('staleness_events').notNull().default(0),

  /** Circuit breaker trips in this window */
  circuitBreakerTrips: integer('circuit_breaker_trips').notNull().default(0),

  /** Uptime percentage (0-10000 for 2 decimal precision) */
  uptimeBps: integer('uptime_bps').notNull().default(10000),

  /** Average confidence interval width (bps) */
  avgConfidenceWidthBps: integer('avg_confidence_width_bps'),

  /** Minimum price in this window */
  minPrice: varchar('min_price', { length: 64 }),

  /** Maximum price in this window */
  maxPrice: varchar('max_price', { length: 64 }),

  /** Average price in this window */
  avgPrice: varchar('avg_price', { length: 64 }),

  /** Created timestamp */
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Indexes
// CREATE INDEX idx_feed_metrics_feed_window ON feed_metrics (feed_id, window_start DESC);
// CREATE INDEX idx_feed_metrics_venture ON feed_metrics (venture_id, window_start DESC);
```

### oracle_audit_log

```typescript
/**
 * oracle_audit_log — Immutable audit trail for oracle operations.
 *
 * Every configuration change, circuit breaker event, fallback activation,
 * and anomaly detection is logged here. Critical for post-incident
 * analysis, regulatory compliance, and security auditing.
 */
export const oracleAuditLog = pgTable('oracle_audit_log', {
  /** Primary key */
  id: uuid('id').primaryKey().defaultRandom(),

  /** Venture context */
  ventureId: uuid('venture_id').notNull(),

  /** Feed ID (if applicable) */
  feedId: varchar('feed_id', { length: 64 }),

  /** Action type */
  action: varchar('action', { length: 64 }).notNull(),

  /** Actor (user ID, system, or service name) */
  actor: varchar('actor', { length: 128 }).notNull(),

  /** Detailed description */
  description: text('description').notNull(),

  /** Before state (JSON) */
  beforeState: jsonb('before_state'),

  /** After state (JSON) */
  afterState: jsonb('after_state'),

  /** Additional metadata */
  metadata: jsonb('metadata').notNull().default({}),

  /** IP address or source identifier */
  sourceIp: varchar('source_ip', { length: 64 }),

  /** Timestamp (immutable) */
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Indexes
// CREATE INDEX idx_oracle_audit_venture ON oracle_audit_log (venture_id, created_at DESC);
// CREATE INDEX idx_oracle_audit_feed ON oracle_audit_log (feed_id, created_at DESC);
// CREATE INDEX idx_oracle_audit_action ON oracle_audit_log (action, created_at DESC);
```

---

## Code Examples

### 1. Get Current Price

```typescript
import { OracleService } from '@mcv/web3-public/oracles';

/**
 * Fetch the current verified price for SOL/USD.
 * The OracleService automatically handles provider selection,
 * aggregation, staleness checks, and confidence verification.
 */
async function getCurrentPrice(ventureId: string): Promise<void> {
  const oracle = new OracleService({ ventureId });

  // Simple price fetch — uses venture's configured feeds and aggregation
  const price = await oracle.getPrice('SOL/USD');

  console.log(`SOL/USD: $${price.priceNumber}`);
  console.log(`Confidence: ±$${price.confidence.valueNumber} (${price.confidence.percentOfPrice}%)`);
  console.log(`Quality: ${price.quality}`);
  console.log(`Sources: ${price.sourceCount}`);
  console.log(`Age: ${price.staleness.ageMs}ms (${price.staleness.level})`);

  // Price with explicit quality requirements
  const strictPrice = await oracle.getPrice('SOL/USD', {
    minQuality: DataPointQuality.HIGH,
    maxAgeMs: 5000,           // No older than 5 seconds
    minSources: 2,            // At least 2 sources must agree
    maxConfidencePercent: 1.0, // Confidence must be within 1% of price
  });

  if (strictPrice.quality === DataPointQuality.REJECTED) {
    console.error('Could not get a high-quality price — falling back');
    // Handle degraded mode
  }

  // Get multiple prices at once (batched for efficiency)
  const prices = await oracle.getPrices(['SOL/USD', 'BTC/USD', 'ETH/USD', 'USDC/USD']);

  for (const [pair, data] of Object.entries(prices)) {
    console.log(`${pair}: $${data.priceNumber} (${data.staleness.level})`);
  }
}

/**
 * Get price directly from a specific provider (bypass aggregation).
 */
async function getProviderPrice(): Promise<void> {
  const oracle = new OracleService({ ventureId: 'venture-123' });

  // Direct Pyth price — sub-second, single source
  const pythPrice = await oracle.getProviderPrice('SOL/USD', OracleProvider.PYTH);

  console.log(`Pyth SOL/USD: $${pythPrice.priceNumber}`);
  console.log(`Pyth slot: ${pythPrice.slot}`);
  console.log(`Publishers: ${pythPrice.numSources}`);

  // Direct Switchboard price
  const swbPrice = await oracle.getProviderPrice('SOL/USD', OracleProvider.SWITCHBOARD);

  console.log(`Switchboard SOL/USD: $${swbPrice.priceNumber}`);

  // Compare sources
  const divergenceBps = Math.abs(
    ((pythPrice.priceNumber - swbPrice.priceNumber) / pythPrice.priceNumber) * 10000
  );
  console.log(`Source divergence: ${divergenceBps.toFixed(1)} bps`);
}
```

### 2. Configure and Register Feeds

```typescript
import {
  OracleService,
  FeedManagementService,
  OracleProvider,
  AggregationMethod,
} from '@mcv/web3-public/oracles';

/**
 * Set up oracle configuration for a new venture.
 * This defines the venture's oracle parameters and registers
 * the price feeds it needs.
 */
async function setupVentureOracle(ventureId: string): Promise<void> {
  const feedMgmt = new FeedManagementService({ ventureId });

  // 1. Create venture-level oracle config
  const config = await feedMgmt.createConfig({
    ventureId,
    name: 'DeFi Pool Oracle Config',
    defaultAggregation: AggregationMethod.MEDIAN,
    defaultStalenessThresholdMs: 30_000,          // 30 seconds
    defaultConfidenceThreshold: 0.95,              // 95% confidence required
    defaultDeviationThresholdBps: 500,             // 5% max deviation
    circuitBreakerEnabled: true,
    circuitBreakerThreshold: 5,                    // 5 consecutive failures
    circuitBreakerCooldownMs: 60_000,              // 1 minute cooldown
    fallbackStrategy: {
      type: 'cached_price',
      maxCacheAgeMs: 120_000,                      // Use cached price up to 2 minutes old
      alertOnFallback: true,
      maxConsecutiveFallbacks: 10,
    },
    historicalStorageEnabled: true,
    historicalRetentionDays: 90,
  });

  console.log(`Created oracle config: ${config.id}`);

  // 2. Register SOL/USD feed with Pyth as primary, Switchboard as backup
  const solFeed = await feedMgmt.registerFeed({
    oracleConfigId: config.id,
    feedId: 'SOL/USD',
    displayName: 'Solana / US Dollar',
    primaryProvider: OracleProvider.PYTH,
    primaryProviderFeedId: 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
    secondaryProviders: [
      {
        provider: OracleProvider.SWITCHBOARD,
        providerFeedId: 'GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR',
        priority: 1,
      },
    ],
    configOverrides: {
      stalenessThresholdMs: 10_000,   // SOL/USD updates frequently — tighter staleness
      minSources: 1,                   // Pyth alone is sufficient
      updateIntervalMs: 1_000,         // Poll every second
      priority: 10,                    // High priority feed
    },
    isRequired: true,
  });

  console.log(`Registered feed: ${solFeed.feedId} (${solFeed.id})`);

  // 3. Register BTC/USD feed
  const btcFeed = await feedMgmt.registerFeed({
    oracleConfigId: config.id,
    feedId: 'BTC/USD',
    displayName: 'Bitcoin / US Dollar',
    primaryProvider: OracleProvider.PYTH,
    primaryProviderFeedId: 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    secondaryProviders: [
      {
        provider: OracleProvider.SWITCHBOARD,
        providerFeedId: '8SXvChNYFhRq4EZuZvnhjrB3jJRQCv4k3P4W6hesH3Ee',
        priority: 1,
      },
    ],
    configOverrides: {
      aggregationMethod: AggregationMethod.MEDIAN,
      twapWindowSec: 300,              // 5-minute TWAP available
      tags: ['major', 'cross-chain'],
    },
    isRequired: true,
  });

  console.log(`Registered feed: ${btcFeed.feedId} (${btcFeed.id})`);

  // 4. Register USDC/USD (stablecoin — tighter deviation threshold)
  await feedMgmt.registerFeed({
    oracleConfigId: config.id,
    feedId: 'USDC/USD',
    displayName: 'USD Coin / US Dollar',
    primaryProvider: OracleProvider.PYTH,
    primaryProviderFeedId: 'eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
    secondaryProviders: [],
    configOverrides: {
      deviationThresholdBps: 50,       // Only 0.5% deviation allowed for stablecoin
      stalenessThresholdMs: 60_000,    // Stablecoin can tolerate slightly older data
    },
    isRequired: false,
  });

  // 5. List all registered feeds
  const feeds = await feedMgmt.listFeeds();
  console.log(`\nRegistered ${feeds.length} feeds:`);
  for (const feed of feeds) {
    console.log(`  ${feed.feedId} [${feed.primaryProvider}] — ${feed.status}`);
  }

  // 6. Activate all feeds (start polling/streaming)
  await feedMgmt.activateAllFeeds();
  console.log('All feeds activated');
}

/**
 * Update feed configuration (e.g., tighten staleness during high volatility).
 */
async function updateFeedConfig(ventureId: string): Promise<void> {
  const feedMgmt = new FeedManagementService({ ventureId });

  // Tighten SOL/USD staleness during high volatility
  await feedMgmt.updateFeed('SOL/USD', {
    configOverrides: {
      stalenessThresholdMs: 5_000,     // 5 seconds — very tight
      deviationThresholdBps: 200,      // 2% max deviation
      minSources: 2,                    // Require 2 sources during volatility
      updateIntervalMs: 500,            // Poll every 500ms
    },
  });

  console.log('SOL/USD feed config tightened for high volatility');

  // Pause a non-critical feed
  await feedMgmt.pauseFeed('USDC/USD');
  console.log('USDC/USD feed paused');

  // Resume it later
  await feedMgmt.resumeFeed('USDC/USD');
  console.log('USDC/USD feed resumed');
}
```

### 3. Staleness Detection and Monitoring

```typescript
import {
  StalenessMonitor,
  OracleService,
  StalenessLevel,
  AlertSeverity,
} from '@mcv/web3-public/oracles';

/**
 * Monitor feed freshness and react to staleness events.
 */
async function monitorStaleness(ventureId: string): Promise<void> {
  const monitor = new StalenessMonitor({ ventureId });

  // Check staleness of a specific feed
  const check = await monitor.checkFeed('SOL/USD');

  console.log(`SOL/USD staleness: ${check.level}`);
  console.log(`  Age: ${check.ageMs}ms / ${check.thresholdMs}ms threshold`);
  console.log(`  Usable: ${check.isUsable}`);
  console.log(`  Time until stale: ${check.timeUntilStaleMs}ms`);
  console.log(`  Staleness %: ${check.stalenessPercent.toFixed(1)}%`);
  console.log(`  Recommended: ${check.recommendedAction}`);

  // Check all feeds at once
  const allChecks = await monitor.checkAllFeeds();

  for (const [feedId, feedCheck] of Object.entries(allChecks)) {
    if (feedCheck.level !== StalenessLevel.FRESH) {
      console.warn(`⚠️ ${feedId}: ${feedCheck.level} (${feedCheck.ageMs}ms old)`);
    }
  }

  // Register event listeners for real-time monitoring
  monitor.on('staleness:warning', (event) => {
    console.warn(`[WARNING] Feed ${event.feedId} approaching staleness: ${event.ageMs}ms`);
  });

  monitor.on('staleness:stale', (event) => {
    console.error(`[STALE] Feed ${event.feedId} is stale: ${event.ageMs}ms`);
    // Trigger fallback strategy
  });

  monitor.on('staleness:critical', (event) => {
    console.error(`[CRITICAL] Feed ${event.feedId} critically stale: ${event.ageMs}ms`);
    // Circuit breaker will engage automatically
  });

  monitor.on('staleness:recovered', (event) => {
    console.log(`[RECOVERED] Feed ${event.feedId} recovered after ${event.downtimeMs}ms`);
  });

  monitor.on('circuit_breaker:tripped', (event) => {
    console.error(`[CIRCUIT BREAKER] Tripped for ${event.feedId}: ${event.reason}`);
    // Alert ops team
  });

  monitor.on('circuit_breaker:reset', (event) => {
    console.log(`[CIRCUIT BREAKER] Reset for ${event.feedId} after ${event.cooldownMs}ms cooldown`);
  });

  // Start continuous monitoring (polls at configured intervals)
  await monitor.start();
  console.log('Staleness monitoring started');

  // Get health summary
  const health = await monitor.getHealthStatus();

  console.log(`\nOracle Health: ${health.status}`);
  console.log(`  Active feeds: ${health.activeFeedCount}`);
  console.log(`  Stale feeds: ${health.staleFeedCount}`);
  console.log(`  Errored feeds: ${health.erroredFeedCount}`);
  console.log(`  Circuit breaker: ${health.circuitBreakerTripped ? 'TRIPPED' : 'OK'}`);
  console.log(`  Avg latency: ${health.avgUpdateLatencyMs}ms`);

  if (health.activeAlerts.length > 0) {
    console.log(`\n  Active Alerts:`);
    for (const alert of health.activeAlerts) {
      console.log(`    [${alert.severity}] ${alert.message}`);
    }
  }
}

/**
 * Query historical staleness alerts for incident analysis.
 */
async function analyzeStalenesHistory(ventureId: string): Promise<void> {
  const monitor = new StalenessMonitor({ ventureId });

  // Get alerts from the last 24 hours
  const alerts = await monitor.getAlerts({
    from: new Date(Date.now() - 24 * 60 * 60 * 1000),
    to: new Date(),
    severity: [AlertSeverity.ERROR, AlertSeverity.CRITICAL],
    resolved: false,
  });

  console.log(`${alerts.length} unresolved error/critical alerts in last 24h:`);

  for (const alert of alerts) {
    console.log(`  [${alert.createdAt.toISOString()}] ${alert.alertType}: ${alert.message}`);
    console.log(`    Feed: ${alert.feedId}, Age: ${alert.dataAgeMs}ms`);
  }

  // Acknowledge alerts
  for (const alert of alerts) {
    await monitor.acknowledgeAlert(alert.id, {
      acknowledgedBy: 'ops-team',
      notes: 'Investigating Pyth network latency spike',
    });
  }
}
```

### 4. Custom Oracle Feed (Venture-Specific Data)

```typescript
import {
  CustomFeedService,
  OracleProvider,
} from '@mcv/web3-public/oracles';

/**
 * Create a custom oracle feed for BetEdge sports odds.
 * This feed pulls NFL game odds from an external API,
 * validates the response, and publishes it as an oracle value.
 */
async function createSportsOddsFeed(ventureId: string): Promise<void> {
  const customService = new CustomFeedService({ ventureId });

  const feed = await customService.createFeed({
    name: 'BetEdge NFL Odds — KC vs SF',
    description: 'Real-time moneyline odds for Kansas City Chiefs vs San Francisco 49ers',
    definition: {
      sourceType: 'http_api',
      sourceUrl: 'https://api.sportsdata.io/v3/nfl/odds/json/GameOddsByWeek/2025REG/18',
      httpMethod: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      valuePath: '$.games[?(@.homeTeam=="KC")].odds.moneyline.home',
      valueType: 'number',
      decimals: 0,
      responseSchema: {
        type: 'object',
        required: ['games'],
        properties: {
          games: {
            type: 'array',
            items: {
              type: 'object',
              required: ['homeTeam', 'odds'],
            },
          },
        },
      },
      auth: {
        type: 'api_key',
        secretRef: 'vault://secrets/sportsdata-api-key',
        keyName: 'Ocp-Apim-Subscription-Key',
      },
      retryConfig: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
      },
    },
    updateIntervalMs: 30_000,           // Update every 30 seconds
    requiredAttestors: 1,                // Single attestor for now
    attestorPubkeys: ['BetEdge11111111111111111111111111111111111'],
  });

  console.log(`Created custom feed: ${feed.name} (${feed.id})`);
  console.log(`Status: ${feed.status}`);

  // Activate the feed
  await customService.activateFeed(feed.id);
  console.log('Feed activated — polling started');

  // Manually trigger an update (for testing)
  const result = await customService.triggerUpdate(feed.id);
  console.log(`Manual update result: ${result.latestValue}`);
}

/**
 * Create a custom oracle for Futurestate property valuations.
 */
async function createPropertyValuationFeed(ventureId: string): Promise<void> {
  const customService = new CustomFeedService({ ventureId });

  const feed = await customService.createFeed({
    name: 'Futurestate — LA Median Home Price',
    description: 'Monthly median home price for Los Angeles metro area from Zillow API',
    definition: {
      sourceType: 'http_api',
      sourceUrl: 'https://api.bridgedataoutput.com/api/v2/zestimates_v2/zestimates',
      httpMethod: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      valuePath: '$.bundle[0].zestimate',
      valueType: 'number',
      decimals: 2,
      transformExpression: 'Math.round(value * 100) / 100', // Round to cents
      auth: {
        type: 'bearer',
        secretRef: 'vault://secrets/zillow-api-token',
      },
      retryConfig: {
        maxRetries: 5,
        initialDelayMs: 2000,
        maxDelayMs: 30000,
        backoffMultiplier: 2,
      },
    },
    updateIntervalMs: 3_600_000,          // Update hourly (property data is slow-moving)
    requiredAttestors: 2,                  // Require 2 attestors for high-value data
    attestorPubkeys: [
      'FState1111111111111111111111111111111111111',
      'FState2222222222222222222222222222222222222',
    ],
  });

  console.log(`Created property valuation feed: ${feed.id}`);

  // List all custom feeds for the venture
  const allCustomFeeds = await customService.listFeeds();
  console.log(`\nCustom feeds for venture:`);
  for (const f of allCustomFeeds) {
    console.log(`  ${f.name}: ${f.latestValue ?? 'no data yet'} (${f.status})`);
  }
}

/**
 * Create a custom oracle for prediction market outcomes (Axiom).
 */
async function createPredictionMarketFeed(ventureId: string): Promise<void> {
  const customService = new CustomFeedService({ ventureId });

  await customService.createFeed({
    name: 'Axiom — BTC > $200K by Dec 2025 Probability',
    description: 'Real-time probability of BTC exceeding $200K by December 2025',
    definition: {
      sourceType: 'http_api',
      sourceUrl: 'https://api.axiom.mcv/v1/markets/btc-200k-dec2025/probability',
      httpMethod: 'GET',
      valuePath: '$.probability',
      valueType: 'number',
      decimals: 4,
      transformExpression: 'Math.max(0, Math.min(1, value))', // Clamp to [0, 1]
      auth: {
        type: 'bearer',
        secretRef: 'vault://secrets/axiom-internal-api-key',
      },
    },
    updateIntervalMs: 10_000,            // 10 seconds — fast-moving market
    requiredAttestors: 1,
    attestorPubkeys: ['Axiom11111111111111111111111111111111111111'],
  });
}
```

### 5. Multi-Source Aggregation

```typescript
import {
  AggregationService,
  OracleService,
  AggregationMethod,
  OracleProvider,
} from '@mcv/web3-public/oracles';

/**
 * Aggregate prices from multiple oracle sources for maximum resilience.
 * This is how MCV protocols protect against single-source manipulation.
 */
async function aggregatePrices(ventureId: string): Promise<void> {
  const aggregation = new AggregationService({ ventureId });

  // Median aggregation — the most manipulation-resistant
  const medianPrice = await aggregation.aggregate('SOL/USD', {
    method: AggregationMethod.MEDIAN,
    minSources: 2,
    maxSources: 5,
    outlierDetection: {
      enabled: true,
      method: 'z_score',
      threshold: 2.5,         // Exclude data points > 2.5 standard deviations
      minDataPoints: 3,
    },
    recencyBias: true,
    maxAgeSpreadMs: 5_000,    // Sources must be within 5 seconds of each other
  });

  console.log(`Median SOL/USD: $${medianPrice.priceNumber}`);
  console.log(`  Sources used: ${medianPrice.sourceCount}`);
  console.log(`  Spread: ${medianPrice.spreadBps} bps`);
  console.log(`  Quality: ${medianPrice.quality}`);

  if (medianPrice.excludedSources.length > 0) {
    console.warn(`  Excluded sources:`);
    for (const excluded of medianPrice.excludedSources) {
      console.warn(`    ${excluded.dataPoint.provider}: $${excluded.dataPoint.priceNumber} — ${excluded.reason}`);
    }
  }

  // TWAP aggregation — smooths out short-term volatility
  const twapPrice = await aggregation.aggregate('BTC/USD', {
    method: AggregationMethod.TWAP,
    twapWindowSec: 300,       // 5-minute TWAP
    minSources: 1,
    maxSources: 10,
    outlierDetection: {
      enabled: true,
      method: 'iqr',          // Interquartile range for TWAP
      threshold: 1.5,
      minDataPoints: 5,
    },
    recencyBias: false,        // TWAP should weight evenly over the window
    maxAgeSpreadMs: 300_000,   // Full window
  });

  console.log(`\n5-min TWAP BTC/USD: $${twapPrice.priceNumber}`);
  console.log(`  Data points: ${twapPrice.sourceCount}`);

  // Weighted aggregation — assign trust scores to different providers
  const weightedPrice = await aggregation.aggregate('ETH/USD', {
    method: AggregationMethod.WEIGHTED,
    sourceWeights: {
      [OracleProvider.PYTH]: 0.6,          // Pyth gets 60% weight
      [OracleProvider.SWITCHBOARD]: 0.3,   // Switchboard gets 30%
      [OracleProvider.CUSTOM]: 0.1,        // Custom feed gets 10%
    },
    minSources: 2,
    maxSources: 5,
    outlierDetection: {
      enabled: true,
      method: 'mad',           // Median Absolute Deviation
      threshold: 3.0,
      minDataPoints: 2,
    },
    recencyBias: true,
    maxAgeSpreadMs: 10_000,
  });

  console.log(`\nWeighted ETH/USD: $${weightedPrice.priceNumber}`);
  console.log(`  Quality: ${weightedPrice.quality}`);

  // Compare aggregation methods for the same feed
  const comparison = await aggregation.compareStrategies('SOL/USD', [
    AggregationMethod.MEDIAN,
    AggregationMethod.TWAP,
    AggregationMethod.MEAN,
    AggregationMethod.WEIGHTED,
  ]);

  console.log('\nAggregation Method Comparison for SOL/USD:');
  for (const [method, result] of Object.entries(comparison)) {
    console.log(`  ${method}: $${result.priceNumber} (spread: ${result.spreadBps} bps, quality: ${result.quality})`);
  }
}

/**
 * Calculate TWAP for a specific time window.
 */
async function calculateTWAPExample(ventureId: string): Promise<void> {
  const oracle = new OracleService({ ventureId });

  // 1-hour TWAP for SOL/USD
  const twap1h = await oracle.getTWAP('SOL/USD', { windowSec: 3600 });
  console.log(`1h TWAP SOL/USD: $${twap1h.priceNumber}`);

  // 5-minute TWAP for BTC/USD
  const twap5m = await oracle.getTWAP('BTC/USD', { windowSec: 300 });
  console.log(`5m TWAP BTC/USD: $${twap5m.priceNumber}`);

  // 24-hour TWAP for governance/reporting
  const twap24h = await oracle.getTWAP('SOL/USD', { windowSec: 86400 });
  console.log(`24h TWAP SOL/USD: $${twap24h.priceNumber}`);
}
```

### 6. Oracle-Dependent Business Logic

```typescript
import {
  OracleService,
  PriceConditionType,
} from '@mcv/web3-public/oracles';

/**
 * Set up price conditions that trigger business logic.
 * This is how ventures implement stop-losses, auto-rebalancing,
 * liquidation triggers, and other price-dependent operations.
 */
async function setupPriceConditions(ventureId: string): Promise<void> {
  const oracle = new OracleService({ ventureId });

  // Stop-loss: alert when SOL drops below $80
  const stopLoss = await oracle.registerCondition({
    feedId: 'SOL/USD',
    type: PriceConditionType.BELOW,
    threshold: '80.00',
    callbackUrl: 'https://api.venture.mcv/webhooks/stop-loss',
    armed: true,
    cooldownMs: 60_000,       // Don't re-trigger for 1 minute
  });

  console.log(`Stop-loss condition registered: ${stopLoss.id}`);

  // Auto-rebalance: trigger when SOL deviates >10% from portfolio target
  const rebalance = await oracle.registerCondition({
    feedId: 'SOL/USD',
    type: PriceConditionType.DEVIATION,
    threshold: '1000',        // 10% in basis points
    windowSec: 3600,          // Compared to 1-hour TWAP
    callbackUrl: 'https://api.venture.mcv/webhooks/rebalance',
    armed: true,
    cooldownMs: 300_000,      // 5-minute cooldown between rebalances
  });

  console.log(`Rebalance condition registered: ${rebalance.id}`);

  // Range exit: alert when BTC leaves $90K-$110K band
  const rangeExit = await oracle.registerCondition({
    feedId: 'BTC/USD',
    type: PriceConditionType.RANGE_EXIT,
    threshold: '90000',       // Lower bound
    upperBound: '110000',     // Upper bound
    callbackUrl: 'https://api.venture.mcv/webhooks/range-alert',
    armed: true,
    cooldownMs: 600_000,      // 10-minute cooldown
  });

  console.log(`Range exit condition registered: ${rangeExit.id}`);

  // Rate of change: alert on rapid price movement (>5% in 5 minutes)
  const flashCrash = await oracle.registerCondition({
    feedId: 'SOL/USD',
    type: PriceConditionType.RATE_OF_CHANGE,
    threshold: '500',         // 5% in basis points
    windowSec: 300,           // 5-minute window
    callbackUrl: 'https://api.venture.mcv/webhooks/flash-crash',
    armed: true,
    cooldownMs: 30_000,       // 30-second cooldown (urgent)
  });

  console.log(`Flash crash detector registered: ${flashCrash.id}`);

  // On-chain trigger: execute a Solana instruction when condition is met
  const onChainTrigger = await oracle.registerCondition({
    feedId: 'SOL/USD',
    type: PriceConditionType.BELOW,
    threshold: '50.00',
    onChainAction: {
      programId: 'VentureProg1111111111111111111111111111111',
      instruction: 'emergency_liquidate',
      accounts: [
        'pool_account_pubkey',
        'treasury_pubkey',
        'oracle_feed_pubkey',
      ],
    },
    armed: true,
    cooldownMs: 0,            // No cooldown — emergency action
  });

  console.log(`On-chain liquidation trigger registered: ${onChainTrigger.id}`);

  // Listen for condition triggers in real-time
  oracle.onConditionTriggered((event) => {
    console.log(`[TRIGGER] Condition ${event.conditionId} fired!`);
    console.log(`  Feed: ${event.feedId}`);
    console.log(`  Price: $${event.currentPrice}`);
    console.log(`  Threshold: ${event.threshold}`);
    console.log(`  Action taken: ${event.actionTaken}`);
  });
}
```

### 7. Historical Data and Analytics

```typescript
import {
  HistoricalDataService,
  DataPointQuality,
} from '@mcv/web3-public/oracles';

/**
 * Query and analyze historical oracle data.
 */
async function queryHistoricalData(ventureId: string): Promise<void> {
  const history = new HistoricalDataService({ ventureId });

  // Get 24h of SOL/USD prices at 1-minute resolution
  const data24h = await history.query({
    feedId: 'SOL/USD',
    from: new Date(Date.now() - 24 * 60 * 60 * 1000),
    to: new Date(),
    resolution: '1m',
    bucketAggregation: 'ohlc',
    minQuality: DataPointQuality.MEDIUM,
  });

  console.log(`24h SOL/USD (1m candles): ${data24h.length} data points`);

  if (data24h.length > 0) {
    const latest = data24h[data24h.length - 1];
    console.log(`  Latest candle: O=${latest.open} H=${latest.high} L=${latest.low} C=${latest.close}`);

    // Calculate 24h high/low
    let high24h = '0';
    let low24h = '999999999';
    for (const dp of data24h) {
      if (parseFloat(dp.high) > parseFloat(high24h)) high24h = dp.high;
      if (parseFloat(dp.low) < parseFloat(low24h)) low24h = dp.low;
    }
    console.log(`  24h High: $${high24h}`);
    console.log(`  24h Low: $${low24h}`);
  }

  // Get 30 days of daily OHLC for analytics
  const data30d = await history.query({
    feedId: 'BTC/USD',
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
    resolution: '1d',
    bucketAggregation: 'ohlc',
    limit: 30,
  });

  console.log(`\n30d BTC/USD (daily): ${data30d.length} data points`);

  // Calculate simple volatility
  const closePrices = data30d.map((dp) => parseFloat(dp.close));
  const returns = [];
  for (let i = 1; i < closePrices.length; i++) {
    returns.push(Math.log(closePrices[i] / closePrices[i - 1]));
  }
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + (r - avgReturn) ** 2, 0) / returns.length;
  const dailyVol = Math.sqrt(variance);
  const annualizedVol = dailyVol * Math.sqrt(365);

  console.log(`  30d daily vol: ${(dailyVol * 100).toFixed(2)}%`);
  console.log(`  Annualized vol: ${(annualizedVol * 100).toFixed(2)}%`);

  // Export historical data for backtesting
  const exportData = await history.export({
    feedId: 'SOL/USD',
    from: new Date('2024-01-01'),
    to: new Date('2024-12-31'),
    resolution: '1h',
    format: 'csv',
  });

  console.log(`\nExported ${exportData.rowCount} rows to ${exportData.filePath}`);

  // Data retention management
  const retentionStats = await history.getRetentionStats();
  console.log(`\nRetention stats:`);
  console.log(`  Total rows: ${retentionStats.totalRows.toLocaleString()}`);
  console.log(`  Oldest data: ${retentionStats.oldestTimestamp.toISOString()}`);
  console.log(`  Storage size: ${retentionStats.storageSizeMb.toFixed(1)} MB`);
  console.log(`  Retention policy: ${retentionStats.retentionDays} days`);

  // Manually trigger cleanup of data older than retention period
  const cleaned = await history.purgeExpired();
  console.log(`  Purged ${cleaned.deletedRows} expired rows`);
}
```

### 8. Cross-Chain Price Data

```typescript
import {
  CrossChainPriceService,
  OracleService,
} from '@mcv/web3-public/oracles';

/**
 * Fetch price data from other chains when Solana-native feeds
 * don't cover a specific asset.
 */
async function getCrossChainPrices(ventureId: string): Promise<void> {
  const crossChain = new CrossChainPriceService({ ventureId });

  // Get ETH/USD from Ethereum mainnet via Wormhole
  const ethPrice = await crossChain.getPrice({
    pair: 'ETH/USD',
    sourceChain: 'ethereum',
    bridgeMethod: 'wormhole',
    maxLatencyMs: 30_000,     // Accept up to 30 seconds of latency
    cacheResult: true,
    cacheTtlMs: 10_000,       // Cache for 10 seconds
  });

  console.log(`ETH/USD (Ethereum via Wormhole): $${ethPrice.priceNumber}`);
  console.log(`  Bridge latency: ${ethPrice.bridgeLatencyMs}ms`);
  console.log(`  Source chain slot: ${ethPrice.sourceChainSlot}`);

  // Get AVAX/USD from Avalanche
  const avaxPrice = await crossChain.getPrice({
    pair: 'AVAX/USD',
    sourceChain: 'avalanche',
    bridgeMethod: 'api_bridge',
    maxLatencyMs: 60_000,
    cacheResult: true,
    cacheTtlMs: 30_000,
  });

  console.log(`AVAX/USD (Avalanche): $${avaxPrice.priceNumber}`);

  // Compare on-chain Solana price vs cross-chain Ethereum price
  const oracle = new OracleService({ ventureId });
  const solanaEthPrice = await oracle.getPrice('ETH/USD');

  const divergenceBps = Math.abs(
    ((solanaEthPrice.priceNumber - ethPrice.priceNumber) / solanaEthPrice.priceNumber) * 10000
  );

  console.log(`\nETH/USD price divergence (Solana vs Ethereum): ${divergenceBps.toFixed(1)} bps`);

  if (divergenceBps > 100) {
    console.warn('⚠️ Significant cross-chain price divergence detected!');
  }
}
```

---

## Error Codes

| Code | Name | Description | Severity |
|------|------|-------------|----------|
| `ORACLE_001` | `FEED_NOT_FOUND` | Requested feed ID is not registered for this venture | ERROR |
| `ORACLE_002` | `FEED_STALE` | Feed data is stale beyond the configured threshold; fallback strategy engaged | WARNING |
| `ORACLE_003` | `FEED_CRITICALLY_STALE` | Feed data is critically stale; circuit breaker may trip | CRITICAL |
| `ORACLE_004` | `PROVIDER_UNAVAILABLE` | Oracle provider (Pyth, Switchboard) is unreachable or returning errors | ERROR |
| `ORACLE_005` | `CONFIDENCE_EXCEEDED` | Price confidence interval exceeds the configured threshold; data quality too low | WARNING |
| `ORACLE_006` | `DEVIATION_EXCEEDED` | Price deviates from reference (TWAP/last known) beyond the configured threshold | ERROR |
| `ORACLE_007` | `CIRCUIT_BREAKER_TRIPPED` | Circuit breaker has engaged due to repeated failures or anomalies; feed halted | CRITICAL |
| `ORACLE_008` | `AGGREGATION_FAILED` | Unable to aggregate prices — insufficient sources or all sources rejected | ERROR |
| `ORACLE_009` | `INSUFFICIENT_SOURCES` | Fewer sources available than the configured minimum; aggregation quality degraded | WARNING |
| `ORACLE_010` | `CUSTOM_FEED_FETCH_FAILED` | Custom feed HTTP request failed after all retries | ERROR |
| `ORACLE_011` | `CUSTOM_FEED_VALIDATION_FAILED` | Custom feed response did not match the expected schema | ERROR |
| `ORACLE_012` | `CUSTOM_FEED_ATTESTATION_FAILED` | Custom feed value could not be verified by required number of attestors | CRITICAL |
| `ORACLE_013` | `OUTLIER_DETECTED` | One or more source prices were identified as outliers and excluded from aggregation | INFO |
| `ORACLE_014` | `CROSS_CHAIN_BRIDGE_FAILED` | Cross-chain price bridge (Wormhole/LayerZero) failed or timed out | ERROR |
| `ORACLE_015` | `CROSS_CHAIN_LATENCY_EXCEEDED` | Cross-chain price data arrived but exceeded the maximum acceptable latency | WARNING |
| `ORACLE_016` | `CONFIG_INVALID` | Oracle configuration is invalid or contains conflicting settings | ERROR |
| `ORACLE_017` | `FEED_ALREADY_EXISTS` | Attempted to register a feed that already exists for this venture | ERROR |
| `ORACLE_018` | `FALLBACK_EXHAUSTED` | All fallback strategies have been exhausted; no price data available | CRITICAL |
| `ORACLE_019` | `HISTORICAL_QUERY_TOO_LARGE` | Historical data query would return too many rows; use a coarser resolution or smaller time range | WARNING |
| `ORACLE_020` | `MANIPULATION_SUSPECTED` | Anomaly detection flagged potential oracle manipulation; prices diverge abnormally across sources | CRITICAL |

### Error Handling

```typescript
import { OracleError, OracleErrorCode } from '@mcv/web3-public/oracles';

try {
  const price = await oracle.getPrice('SOL/USD');
} catch (error) {
  if (error instanceof OracleError) {
    switch (error.code) {
      case OracleErrorCode.FEED_STALE:
        // Use fallback price or cached value
        console.warn(`Feed stale: ${error.message}`);
        const fallbackPrice = await oracle.getFallbackPrice('SOL/USD');
        break;

      case OracleErrorCode.CIRCUIT_BREAKER_TRIPPED:
        // Halt operations that depend on this price
        console.error(`Circuit breaker tripped: ${error.message}`);
        await haltPriceDependent Operations();
        break;

      case OracleErrorCode.MANIPULATION_SUSPECTED:
        // Emergency: alert security team, potentially halt all trading
        console.error(`🚨 MANIPULATION SUSPECTED: ${error.message}`);
        await alertSecurityTeam(error);
        await emergencyHalt();
        break;

      case OracleErrorCode.CONFIDENCE_EXCEEDED:
        // Data exists but quality is poor — decide based on use case
        console.warn(`Low confidence: ${error.context.confidencePercent}%`);
        break;

      default:
        console.error(`Oracle error [${error.code}]: ${error.message}`);
    }
  }
}
```

---

## Security Considerations

Oracle security is paramount. Oracle manipulation attacks have caused over **$1 billion** in losses across DeFi. The `@mcv/web3-public/oracles` module implements defense-in-depth:

### Attack Vectors and Mitigations

#### 1. Flash Loan Oracle Manipulation

**Attack:** Attacker takes a flash loan to temporarily move an AMM price, then uses the manipulated oracle reading to exploit a lending protocol.

**Mitigation:**
- **TWAP over configurable windows** — Short-term price manipulation is smoothed out by time-weighted averaging
- **Multi-source aggregation** — Even if one AMM is manipulated, other sources (Pyth, Switchboard) reflect the true price
- **Deviation detection** — Sudden large deviations from TWAP/reference price trigger alerts and circuit breakers
- **Rate-of-change limits** — Price changes beyond configurable thresholds in short windows are flagged

#### 2. Stale Price Exploitation

**Attack:** Attacker exploits a stale oracle price that no longer reflects market reality (e.g., after a market crash, the oracle still reports the old price).

**Mitigation:**
- **Configurable staleness thresholds** — Per-feed, per-venture staleness limits
- **Continuous monitoring** with WARNING → STALE → CRITICAL escalation
- **Circuit breaker** — Automatically halts operations when data is critically stale
- **Fallback strategies** — Ordered fallback chain (secondary provider → cached with max age → TWAP fallback → halt)

#### 3. Single-Source Compromise

**Attack:** A single oracle provider is compromised, hacked, or experiences a bug that emits incorrect prices.

**Mitigation:**
- **Multi-source aggregation** — Median of 3+ sources means a single compromised source is outvoted
- **Outlier detection** — Z-score, IQR, and MAD filters identify and exclude anomalous data points
- **Source health tracking** — Consecutive failure counters and trust weight adjustments
- **Provider diversity** — Pyth (push), Switchboard (crank), custom (API) — different architectures reduce correlated failures

#### 4. Price Feed Front-Running

**Attack:** Attacker observes an oracle update transaction in the mempool and front-runs it to extract value.

**Mitigation:**
- **Pyth pull model** — Consumers pull prices on-demand rather than relying on on-chain push transactions that can be front-run
- **Confidential price updates** — Where supported, use encrypted oracle updates that are revealed atomically
- **Transaction ordering protections** — Use Jito or similar MEV protection for oracle-dependent transactions

#### 5. Custom Feed Compromise

**Attack:** An external API used by a custom feed is compromised, returning falsified data.

**Mitigation:**
- **Multi-attestor verification** — Require multiple independent parties to attest to custom feed values
- **Response schema validation** — Strict JSON schema validation rejects malformed responses
- **Rate limiting and anomaly detection** — Sudden value changes beyond historical norms are flagged
- **Audit logging** — Every custom feed update is immutably logged with source response details

### Security Configuration Best Practices

```typescript
// Production-recommended oracle config
const secureConfig: Partial<OracleConfig> = {
  // Always use multi-source aggregation
  defaultAggregation: AggregationMethod.MEDIAN,

  // Tight staleness — 30 seconds for DeFi, up to 60s for less time-sensitive
  defaultStalenessThresholdMs: 30_000,

  // Require high confidence — 95%+ of price
  defaultConfidenceThreshold: 0.95,

  // Flag deviations > 3% from TWAP
  defaultDeviationThresholdBps: 300,

  // Always enable circuit breaker in production
  circuitBreakerEnabled: true,
  circuitBreakerThreshold: 3,         // Trip after 3 failures (aggressive)
  circuitBreakerCooldownMs: 120_000,  // 2-minute cooldown

  // Fallback: use cache briefly, then halt
  fallbackStrategy: {
    type: 'cached_price',
    maxCacheAgeMs: 60_000,            // Max 1 minute cache
    alertOnFallback: true,
    maxConsecutiveFallbacks: 5,        // Halt after 5 consecutive fallbacks
  },

  // Always log historical data for auditing
  historicalStorageEnabled: true,
  historicalRetentionDays: 365,        // 1 year for compliance
};
```

### Audit Trail Requirements

All oracle operations are logged to the `oracle_audit_log` table:

- **Configuration changes** — Who changed what, when, before/after state
- **Circuit breaker events** — Trip and reset with full context
- **Fallback activations** — When, why, what fallback was used
- **Anomaly detections** — Outliers, deviation breaches, manipulation suspects
- **Custom feed updates** — Raw API responses, attestation results
- **Price condition triggers** — What triggered, at what price, what action was taken

Audit logs are **append-only** and should be backed up to immutable storage (S3 Glacier, Arweave) for regulatory compliance.

---

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PYTH_HERMES_URL` | Pyth Hermes API endpoint for price data | `https://hermes.pyth.network` | No |
| `PYTH_PROGRAM_ID` | Pyth on-chain program ID (mainnet) | `FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH` | No |
| `PYTH_PROGRAM_ID_DEVNET` | Pyth on-chain program ID (devnet) | `gSbePebfvPy7tRqimPoVecS2UsBvYv46ynrzWocc92s` | No |
| `SWITCHBOARD_PROGRAM_ID` | Switchboard V2 program ID (mainnet) | `SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f` | No |
| `SWITCHBOARD_PROGRAM_ID_DEVNET` | Switchboard V2 program ID (devnet) | `2TfB33aLaneQb5TNVwyDz3jSZXS6jdW2ARw1Dgf84XCG` | No |
| `ORACLE_DB_URL` | Database connection string for oracle tables | — | Yes |
| `ORACLE_DEFAULT_STALENESS_MS` | Global default staleness threshold | `30000` | No |
| `ORACLE_DEFAULT_CONFIDENCE_BPS` | Global default confidence threshold (basis points) | `9500` | No |
| `ORACLE_DEFAULT_DEVIATION_BPS` | Global default deviation threshold (basis points) | `500` | No |
| `ORACLE_CIRCUIT_BREAKER_THRESHOLD` | Global circuit breaker failure count | `5` | No |
| `ORACLE_CIRCUIT_BREAKER_COOLDOWN_MS` | Global circuit breaker cooldown | `60000` | No |
| `ORACLE_HISTORICAL_RETENTION_DAYS` | Default retention for price history | `90` | No |
| `ORACLE_METRICS_INTERVAL_MS` | Interval for metrics snapshot capture | `300000` | No |
| `ORACLE_CUSTOM_FEED_TIMEOUT_MS` | HTTP timeout for custom feed requests | `10000` | No |
| `ORACLE_ALERT_WEBHOOK_URL` | Webhook URL for critical oracle alerts | — | No |
| `ORACLE_ALERT_EMAIL` | Email for critical oracle alerts | — | No |
| `WORMHOLE_RPC_URL` | Wormhole Guardian RPC for cross-chain data | `https://wormhole-v2-mainnet-api.certus.one` | No |
| `SOLANA_RPC_URL` | Solana RPC endpoint (used by oracle providers) | `https://api.mainnet-beta.solana.com` | Yes |
| `ORACLE_LOG_LEVEL` | Logging level for oracle module | `info` | No |
| `ORACLE_ENABLE_STREAMING` | Enable WebSocket streaming from Pyth | `true` | No |

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/core` | Base types, error handling, logging |
| `@mcv/db` | Drizzle ORM connection, migration utilities |
| `@mcv/web3-public/solana-core` | Solana connection management, transaction building |
| `@mcv/web3-public/programs` | On-chain program interactions for oracle accounts |
| `@mcv/monitoring` | Metrics, alerting, health check integration |
| `@mcv/vault` | Secret management for custom feed API keys |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@pythnetwork/hermes-client` | `^1.x` | Pyth Hermes API client for price feeds |
| `@pythnetwork/pyth-solana-receiver` | `^0.x` | On-chain Pyth price account parsing |
| `@switchboard-xyz/solana.js` | `^3.x` | Switchboard V2 SDK for custom feeds |
| `@solana/web3.js` | `^1.x` | Solana RPC and account interaction |
| `@wormhole-foundation/sdk` | `^0.x` | Cross-chain data bridging via Wormhole |
| `drizzle-orm` | `^0.30.x` | Database ORM for oracle tables |
| `bignumber.js` | `^9.x` | Arbitrary-precision arithmetic for prices |
| `jsonpath-plus` | `^7.x` | JSONPath evaluation for custom feed value extraction |
| `ajv` | `^8.x` | JSON schema validation for custom feed responses |
| `eventemitter3` | `^5.x` | Event emitter for staleness and condition callbacks |
| `p-retry` | `^6.x` | Retry logic for custom feed HTTP requests |
| `zod` | `^3.x` | Runtime type validation for oracle configs |

---

## Testing Notes

### Unit Tests

```typescript
// tests/oracle.service.test.ts
describe('OracleService', () => {
  it('should fetch current price from Pyth', async () => {
    // Mock PythProvider to return known price
    const mockPyth = createMockPythProvider({
      'SOL/USD': { price: '150.25', confidence: '0.15', slot: 280000000 },
    });

    const service = new OracleService({
      ventureId: 'test-venture',
      providers: { pyth: mockPyth },
    });

    const result = await service.getPrice('SOL/USD');
    expect(result.priceNumber).toBe(150.25);
    expect(result.quality).toBe(DataPointQuality.HIGH);
  });

  it('should fallback to secondary provider on primary failure', async () => {
    const mockPyth = createMockPythProvider({});
    mockPyth.getPrice = vi.fn().mockRejectedValue(new Error('Pyth unavailable'));

    const mockSwb = createMockSwitchboardProvider({
      'SOL/USD': { price: '150.00', confidence: '0.30' },
    });

    const service = new OracleService({
      ventureId: 'test-venture',
      providers: { pyth: mockPyth, switchboard: mockSwb },
    });

    const result = await service.getPrice('SOL/USD');
    expect(result.priceNumber).toBe(150.0);
    expect(result.provider).toBe(OracleProvider.SWITCHBOARD);
  });

  it('should reject stale data', async () => {
    const mockPyth = createMockPythProvider({
      'SOL/USD': {
        price: '150.00',
        confidence: '0.10',
        timestamp: new Date(Date.now() - 120_000), // 2 minutes old
      },
    });

    const service = new OracleService({
      ventureId: 'test-venture',
      providers: { pyth: mockPyth },
      config: { defaultStalenessThresholdMs: 30_000 },
    });

    await expect(service.getPrice('SOL/USD')).rejects.toThrow(OracleError);
  });

  it('should trip circuit breaker after consecutive failures', async () => {
    const mockPyth = createMockPythProvider({});
    mockPyth.getPrice = vi.fn().mockRejectedValue(new Error('fail'));

    const service = new OracleService({
      ventureId: 'test-venture',
      providers: { pyth: mockPyth },
      config: { circuitBreakerThreshold: 3 },
    });

    // Trigger 3 failures
    for (let i = 0; i < 3; i++) {
      try { await service.getPrice('SOL/USD'); } catch {}
    }

    // 4th call should get circuit breaker error, not provider error
    await expect(service.getPrice('SOL/USD')).rejects.toMatchObject({
      code: OracleErrorCode.CIRCUIT_BREAKER_TRIPPED,
    });
  });
});
```

### Integration Tests

```typescript
// tests/integration/oracle-pyth.integration.test.ts
describe('Pyth Integration (devnet)', () => {
  it('should fetch live SOL/USD price from Pyth Hermes', async () => {
    const provider = new PythProvider({
      hermesUrl: 'https://hermes.pyth.network',
      network: 'devnet',
    });

    const price = await provider.getPrice(
      'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d'
    );

    expect(price.priceNumber).toBeGreaterThan(0);
    expect(price.confidence.valueNumber).toBeGreaterThan(0);
    expect(price.numSources).toBeGreaterThan(0);

    // Verify freshness (should be within 30 seconds on devnet)
    const ageMs = Date.now() - price.sourceTimestamp.getTime();
    expect(ageMs).toBeLessThan(60_000);
  });
});
```

### Testing Staleness

```typescript
// tests/staleness-monitor.test.ts
describe('StalenessMonitor', () => {
  it('should emit warning when feed approaches staleness', async () => {
    const monitor = new StalenessMonitor({
      ventureId: 'test',
      config: { defaultStalenessThresholdMs: 10_000 },
    });

    const warningPromise = new Promise((resolve) => {
      monitor.on('staleness:warning', resolve);
    });

    // Simulate feed that hasn't been updated for 8 seconds (80% of threshold)
    await monitor.injectTestDataPoint('SOL/USD', {
      timestamp: new Date(Date.now() - 8_000),
    });

    await monitor.checkFeed('SOL/USD');

    const event = await warningPromise;
    expect(event.feedId).toBe('SOL/USD');
    expect(event.level).toBe(StalenessLevel.WARNING);
  });

  it('should detect outliers using z-score method', () => {
    const prices = [100, 101, 99, 100.5, 102, 98, 500]; // 500 is outlier

    const result = detectOutliers(prices, { method: 'z_score', threshold: 2.5 });

    expect(result.outliers).toContain(500);
    expect(result.clean).not.toContain(500);
    expect(result.clean).toHaveLength(6);
  });
});
```

### Testing Custom Feeds

```typescript
// tests/custom-feed.test.ts
describe('CustomFeedService', () => {
  it('should fetch and validate custom feed data', async () => {
    // Mock the HTTP endpoint
    const mockServer = createMockServer();
    mockServer.get('/odds', () => ({
      games: [
        { homeTeam: 'KC', odds: { moneyline: { home: -150 } } },
      ],
    }));

    const service = new CustomFeedService({ ventureId: 'test' });

    const feed = await service.createFeed({
      name: 'Test Odds Feed',
      description: 'test',
      definition: {
        sourceType: 'http_api',
        sourceUrl: `${mockServer.url}/odds`,
        httpMethod: 'GET',
        valuePath: '$.games[0].odds.moneyline.home',
        valueType: 'number',
      },
      updateIntervalMs: 60_000,
      requiredAttestors: 1,
      attestorPubkeys: ['test-attestor'],
    });

    const result = await service.triggerUpdate(feed.id);
    expect(result.latestValue).toBe('-150');
  });

  it('should reject response that fails schema validation', async () => {
    const mockServer = createMockServer();
    mockServer.get('/odds', () => ({ invalid: true })); // Wrong schema

    const service = new CustomFeedService({ ventureId: 'test' });

    const feed = await service.createFeed({
      name: 'Schema Test',
      description: 'test',
      definition: {
        sourceType: 'http_api',
        sourceUrl: `${mockServer.url}/odds`,
        httpMethod: 'GET',
        valuePath: '$.games[0].odds',
        valueType: 'number',
        responseSchema: {
          type: 'object',
          required: ['games'],
          properties: { games: { type: 'array' } },
        },
      },
      updateIntervalMs: 60_000,
      requiredAttestors: 1,
      attestorPubkeys: ['test-attestor'],
    });

    await expect(service.triggerUpdate(feed.id)).rejects.toMatchObject({
      code: OracleErrorCode.CUSTOM_FEED_VALIDATION_FAILED,
    });
  });
});
```

### Load Testing

```typescript
// tests/load/oracle-throughput.test.ts
describe('Oracle Throughput', () => {
  it('should handle 1000 concurrent price requests', async () => {
    const oracle = new OracleService({ ventureId: 'load-test' });

    const start = performance.now();

    const promises = Array.from({ length: 1000 }, () =>
      oracle.getPrice('SOL/USD')
    );

    const results = await Promise.allSettled(promises);
    const elapsed = performance.now() - start;

    const successes = results.filter((r) => r.status === 'fulfilled').length;
    const rps = (successes / elapsed) * 1000;

    console.log(`Throughput: ${rps.toFixed(0)} req/s (${successes}/1000 succeeded in ${elapsed.toFixed(0)}ms)`);

    expect(successes).toBeGreaterThan(950); // 95%+ success rate
    expect(rps).toBeGreaterThan(100);       // >100 req/s
  });
});
```

---

## Data Flow: Price Request Lifecycle

```
1. Consumer calls oracle.getPrice('SOL/USD')
   │
2. FeedManagementService looks up registered feed for venture
   │ → Found: SOL/USD, primary=Pyth, secondary=Switchboard
   │
3. PythProvider.getPrice('ef0d8b...') via Hermes API
   │ → Returns: { price: 150.25, confidence: 0.15, slot: 280000123 }
   │
4. SwitchboardProvider.getPrice('GvDMxP...') (if multi-source)
   │ → Returns: { price: 150.30, confidence: 0.20 }
   │
5. AggregationEngine combines sources
   │ → Method: MEDIAN
   │ → Outlier check: both prices within normal range ✓
   │ → Aggregated: 150.275 (midpoint of 2 sources)
   │
6. VerificationPipeline validates the aggregated result
   │ ├── Freshness check: 200ms old → FRESH ✓
   │ ├── Confidence check: 0.1% of price → within 95% threshold ✓
   │ ├── Deviation check: 0.5% from last known → within 5% threshold ✓
   │ └── Circuit breaker: not tripped ✓
   │
7. Quality assessment: HIGH (multi-source, fresh, high confidence)
   │
8. Historical storage: INSERT into price_history
   │
9. Return verified DataPoint to consumer
   │ → { price: "150.275", quality: HIGH, sources: 2, staleness: FRESH }
```

---

## Performance Characteristics

| Operation | Expected Latency | Notes |
|-----------|-----------------|-------|
| Single price fetch (Pyth, cached) | < 5ms | In-memory cache hit |
| Single price fetch (Pyth, live) | 50-200ms | Hermes API round-trip |
| Single price fetch (Switchboard) | 100-500ms | On-chain RPC query |
| Multi-source aggregation (3 sources) | 200-600ms | Parallel fetches + aggregation |
| TWAP calculation (5-min window) | 10-50ms | In-memory or DB query |
| Historical query (1 day, 1m resolution) | 50-200ms | Indexed DB query |
| Historical query (30 days, 1h resolution) | 100-500ms | Indexed DB query |
| Custom feed update (HTTP API) | 200-2000ms | Depends on external API |
| Cross-chain price (Wormhole) | 5-30s | Cross-chain message relay |
| Staleness check | < 1ms | In-memory comparison |
| Health status | 5-20ms | Aggregates in-memory state |

---

## Migration Guide

### Creating Tables

```sql
-- Run via Drizzle migration or manually

-- 1. Create enums
CREATE TYPE oracle_provider AS ENUM ('pyth', 'switchboard', 'custom', 'chainlink_bridge');
CREATE TYPE feed_status AS ENUM ('pending', 'active', 'paused', 'stale', 'deactivated', 'error');
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'error', 'critical');

-- 2. Create tables (Drizzle generates these from schemas above)
-- Run: npx drizzle-kit push:pg

-- 3. Create recommended indexes
CREATE INDEX idx_price_history_feed_time
  ON price_history (feed_id, source_timestamp DESC);

CREATE INDEX idx_price_history_venture_time
  ON price_history (venture_id, source_timestamp DESC);

CREATE INDEX idx_staleness_alerts_unresolved
  ON staleness_alerts (resolved, severity)
  WHERE resolved = false;

CREATE INDEX idx_oracle_audit_venture
  ON oracle_audit_log (venture_id, created_at DESC);

CREATE INDEX idx_feed_metrics_feed_window
  ON feed_metrics (feed_id, window_start DESC);

-- 4. Optional: Enable TimescaleDB for price_history (recommended for production)
-- SELECT create_hypertable('price_history', 'source_timestamp');
```

---

## Related Modules

| Module | Relationship |
|--------|-------------|
| `@mcv/web3-public/solana-core` | Provides Solana RPC connections used by oracle providers |
| `@mcv/web3-public/programs` | On-chain programs that consume oracle data |
| `@mcv/web3-public/tokens` | Token pricing relies on oracle price feeds |
| `@mcv/web3-public/defi` | DeFi operations (swaps, lending) use oracle prices for execution |
| `@mcv/monitoring` | Oracle health metrics feed into the monitoring dashboard |
| `@mcv/vault` | Stores API keys for custom feed external services |
