# @mcv/token-economy — Technical Architecture

**Package:** `@mcv/token-economy`  
**Classification:** PUBLISHABLE (Tier 5 — Domain Layer)  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Diagram](#system-diagram)
3. [Module Architecture](#module-architecture)
   - [ACS — Automated Contribution Scoring](#acs--automated-contribution-scoring)
   - [Launchpad — Token Launch & IDO/ICO Management](#launchpad--token-launch--idoico-management)
   - [Rewards — Reward Distribution & Redemption Engine](#rewards--reward-distribution--redemption-engine)
4. [Data Models](#data-models)
5. [Data Flow & Events](#data-flow--events)
6. [Integration Points](#integration-points)
7. [Performance](#performance)
8. [Scalability](#scalability)
9. [Error Handling](#error-handling)
10. [Observability](#observability)
11. [Security](#security)

---

## Architecture Overview

`@mcv/token-economy` is the economic backbone of the MCV ecosystem. It governs every token flow — from user actions generating off-chain points, through algorithmic parameter tuning, to on-chain EDGE token distributions on Solana. The architecture bridges two fundamentally different domains: **off-chain scoring** (fast, cheap, flexible) and **on-chain settlement** (immutable, verifiable, trustless).

### Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Append-only ledger** | The point entries table (`reward_point_entries`) is immutable — no UPDATE or DELETE. Every correction is a new negative entry referencing the original. |
| **Defense in depth** | Anti-gaming engine runs on every single point accrual with 8 independent checks. No bypass paths exist. |
| **Algorithmic governance** | ACS dynamically adjusts emission rates, staking APYs, conversion ratios, and burn rates based on real-time market conditions — no static schedules. |
| **Cross-venture unification** | A single token economy spans all 9 MCV ventures. Points earned in BetEdge, SerpSpace, Full Gain, MCV Studios, or Futurestate flow through the same infrastructure. |
| **Transparency by default** | Every contribution score, every controller adjustment, every abuse flag has a full audit trail accessible to the affected user or admin. |
| **Batch settlement** | On-chain token distributions are batched (up to 500 recipients per batch) to minimize Solana transaction costs while maintaining timely settlement. |
| **Regime-adaptive economics** | The entire token economy adapts to five regimes (launch → growth → mature → contraction → emergency) with hysteresis bands preventing oscillation. |

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Next.js 15 (App Router) | Server-side rendering, API routes, React Server Components |
| Monorepo | Turborepo | Build orchestration, package dependency management |
| Database | Supabase/PostgreSQL + RLS | Primary persistence with row-level security per venture |
| ORM | Drizzle ORM | Type-safe schema definitions, migrations, query building |
| Cache | Redis (ioredis) | Balance caching, leaderboard sorted sets, rate limiting, anti-abuse sliding windows |
| Queue | Redpanda/Kafka | Async balance updates, distribution processing, decay computation |
| Blockchain | Solana (@solana/web3.js) | EDGE token SPL transfers, vesting streams, launchpad settlement |
| Validation | Zod | Runtime input validation on all API boundaries |
| AI | OpenRouter | AI-optimized reward rates, anomaly detection patterns (Phase 3) |
| Events | @mcv/fabric | Cross-domain event bus, audit trail, background job dispatch |

### Architectural Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                       │
│                                                                              │
│  React Components          React Hooks              Venture UIs              │
│  PointBalanceCard           usePointBalance           BetEdge Dashboard       │
│  LeaderboardTable           useLeaderboard            SerpSpace Rewards       │
│  SaleCard                   useTokenSales             MCV Studios Inventory   │
│  VestingClaimPanel          useVestingProgress        Admin Panels            │
│  TokenEconomyDashboard      useAcsState               Launchpad Pages         │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                           API LAYER (tRPC)                                   │
│                                                                              │
│  rewardsRouter              acsRouter                 launchpadRouter         │
│  points.*                   getState                  sales.*                 │
│  programs.*                 getControllers             whitelist.*             │
│  distributions.*            evaluate                  participate.*           │
│  conversions.*              setOverride               analytics.*             │
│                             forceRegime                                       │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                           SERVICE LAYER                                      │
│                                                                              │
│  ┌──────────────────┐  ┌───────────────────┐  ┌──────────────────────┐      │
│  │     REWARDS       │  │       ACS          │  │      LAUNCHPAD        │      │
│  │                   │  │                    │  │                       │      │
│  │  rewardsService   │  │  acsService        │  │  launchpadService     │      │
│  │  distributionSvc  │  │  acsEngine         │  │  whitelistService     │      │
│  │  conversionSvc    │  │  contributionSvc   │  │  vestingService       │      │
│  │  antiGamingSvc    │  │  leaderboardSvc    │  │  launchAnalyticsSvc   │      │
│  │  rewardPoolSvc    │  │  scoreDecaySvc     │  │  fairLaunchService    │      │
│  │  vestingRewardSvc │  │                    │  │                       │      │
│  └──────────────────┘  └───────────────────┘  └──────────────────────┘      │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                        OFF-CHAIN → ON-CHAIN BRIDGE                           │
│                                                                              │
│  Points/scores in PostgreSQL+Redis  ──→  Conversion Engine  ──→  Solana     │
│  Batch signing  │  Merkle proofs  │  TX submission  │  Confirmation polling  │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                           DATA LAYER                                         │
│                                                                              │
│  PostgreSQL (38 tables total)          Redis                                 │
│  ├── Rewards: 16 tables               ├── Point balance cache               │
│  ├── ACS: 12 tables                   ├── Leaderboard sorted sets           │
│  └── Launchpad: 10 tables             ├── Rate limit sliding windows        │
│                                        ├── Anti-abuse velocity tracking      │
│  Solana (on-chain)                     └── ACS state cache                  │
│  ├── EDGE SPL token                                                          │
│  ├── Vesting stream contracts                                                │
│  └── Launchpad settlement TXs                                                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## System Diagram

### High-Level Component Interaction

```
                    ┌──────────────────────────────────────────────┐
                    │           EXTERNAL ENTRY POINTS               │
                    │                                               │
                    │  API Routes    Cron Jobs    Webhooks   NAOS   │
                    │  /api/rewards  Decay calc   Solana TX  Agent  │
                    │  /api/acs      Eval cycle   Price feed Ctrl   │
                    │  /api/launch   Vesting      Staking    Fabric │
                    └───────────────────┬──────────────────────────┘
                                        │
                    ┌───────────────────▼──────────────────────────┐
                    │              SERVICE LAYER                     │
                    │                                               │
                    │  ┌─────────┐  ┌─────────┐  ┌─────────────┐  │
                    │  │ REWARDS │  │   ACS   │  │  LAUNCHPAD  │  │
                    │  │         │  │         │  │             │  │
                    │  │ Points  │◄─┤ Regime  │  │ Sales       │  │
                    │  │ Pools   │  │ Control │  │ Whitelist   │  │
                    │  │ Claims  │  │ Score   │  │ Vesting     │  │
                    │  │ Anti-   │  │ Leader- │  │ Purchase    │  │
                    │  │ gaming  │  │ board   │  │ Fair Launch │  │
                    │  └────┬────┘  └────┬────┘  └──────┬──────┘  │
                    │       │            │              │          │
                    └───────┼────────────┼──────────────┼──────────┘
                            │            │              │
              ┌─────────────▼────────────▼──────────────▼───────────┐
              │                   DATA LAYER                         │
              │                                                      │
              │  ┌────────────────┐  ┌──────────┐  ┌─────────────┐  │
              │  │  PostgreSQL    │  │  Redis   │  │  Solana     │  │
              │  │  38 tables     │  │  Cache   │  │  EDGE Token │  │
              │  │  RLS per       │  │  Sorted  │  │  SPL Xfers  │  │
              │  │  venture       │  │  Sets    │  │  Vesting    │  │
              │  └────────────────┘  └──────────┘  └─────────────┘  │
              └──────────────────────────────────────────────────────┘
                            │            │              │
              ┌─────────────▼────────────▼──────────────▼───────────┐
              │              EXTERNAL DEPENDENCIES                   │
              │                                                      │
              │  @mcv/web3-core    @mcv/engagement    @mcv/identity  │
              │  @mcv/fabric       @solana/web3.js    merkletreejs   │
              │  @streamflow/stream                   ioredis        │
              └──────────────────────────────────────────────────────┘
```

### Cross-Venture Token Flow

Every venture in the MCV ecosystem generates user actions that flow through a unified economic pipeline:

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   BetEdge    │  │  SerpSpace   │  │  Full Gain   │  │ MCV Studios  │
│              │  │              │  │              │  │              │
│ bet_placed   │  │ content_     │  │ grant_       │  │ achievement_ │
│ bet_won      │  │ created      │  │ milestone    │  │ unlocked     │
│ streak_bonus │  │ tool_usage   │  │ education_   │  │ daily_login  │
│ referral_*   │  │ marketplace  │  │ completed    │  │ quest_*      │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │                 │
       └────────────┬────┴────────┬────────┴─────────┬───────┘
                    │             │                   │
                    ▼             ▼                   ▼
          ┌────────────────────────────────────────────────────┐
          │                @mcv/fabric Event Bus                │
          │  Venture events normalized to standard schema       │
          └────────────────────────┬───────────────────────────┘
                                   │
                                   ▼
          ┌────────────────────────────────────────────────────┐
          │            REWARDS ENGINE                           │
          │                                                     │
          │  1. Anti-Gaming Check (8 checks)                    │
          │     ├── Rate limit                                  │
          │     ├── Velocity anomaly                            │
          │     ├── Device fingerprint                          │
          │     ├── IP reputation                               │
          │     ├── Referral chain analysis                     │
          │     ├── Bot detection                               │
          │     ├── Cross-account correlation (Sybil)           │
          │     └── Anomalous value                             │
          │                                                     │
          │  2. Point Entry (append-only)                        │
          │     └── Write to reward_point_entries                │
          │                                                     │
          │  3. Balance Update (async via queue)                 │
          │     ├── Update reward_point_balances                 │
          │     ├── Sync Redis cache                             │
          │     └── Recalculate tier                             │
          │                                                     │
          │  4. Cross-Venture Rules                              │
          │     └── Evaluate if action triggers bonus in other   │
          │         ventures                                     │
          └────────────────────────┬───────────────────────────┘
                                   │
                                   │ user requests conversion
                                   ▼
          ┌────────────────────────────────────────────────────┐
          │            ACS CONVERSION BRIDGE                    │
          │                                                     │
          │  1. Look up current regime (ACS state)              │
          │  2. Get regime-adjusted conversion rate              │
          │     launch:      0.015 tokens/point                 │
          │     growth:      0.012 tokens/point                 │
          │     mature:      0.010 tokens/point                 │
          │     contraction: 0.006 tokens/point                 │
          │     emergency:   0.003 tokens/point                 │
          │  3. Deduct points from balance                      │
          │  4. Queue for on-chain distribution                 │
          └────────────────────────┬───────────────────────────┘
                                   │
                                   ▼
          ┌────────────────────────────────────────────────────┐
          │            ON-CHAIN DISTRIBUTION                    │
          │                                                     │
          │  1. Create distribution batch                        │
          │  2. Batch signing (treasury wallet)                  │
          │  3. Submit to Solana via @mcv/web3-core              │
          │  4. Confirmation polling                             │
          │  5. Status update: confirmed / failed + retry        │
          └────────────────────────────────────────────────────┘
```

---

## Module Architecture

### ACS — Automated Contribution Scoring

The ACS module is the "central nervous system" of the token economy. It observes market conditions, computes health scores, determines the economic regime, and automatically adjusts tokenomics parameters through a controller engine. It also manages contribution scoring — quantifying the value of user contributions and converting those scores to token allocations.

#### Submodule Structure

```
acs/
├── service.ts              # Public API — acsService, acsEngine, contributionScoringService,
│                           #   leaderboardService, scoreDecayService
├── engine.ts               # Core evaluation engine — regime detection, controller execution
├── scoring.ts              # Contribution scoring engine — formula evaluation, decay, aggregation
├── controllers/
│   ├── base.ts             # BaseController abstract class — dampening, bounds clamping
│   ├── staking-apy.ts      # StakingApyController — adjusts staking yield per regime
│   ├── emission-rate.ts    # EmissionRateController — adjusts token emission per velocity
│   ├── conversion-rate.ts  # ConversionRateController — adjusts point→token ratio
│   ├── burn-rate.ts        # BurnRateController — adjusts transaction fee burn rate
│   └── registry.ts         # Controller registry — all registered controllers
├── metrics/
│   ├── provider.ts         # MetricsProvider interface — fetches market data
│   ├── jupiter.ts          # Jupiter aggregator metrics
│   ├── birdeye.ts          # Birdeye analytics metrics
│   └── coingecko.ts        # CoinGecko market data
├── decay/
│   ├── functions.ts        # Decay function implementations (exponential, linear, step, log)
│   └── scheduler.ts        # Cron-based decay application
├── leaderboard/
│   ├── compute.ts          # Leaderboard computation engine
│   └── cache.ts            # Redis sorted set caching
├── schema.ts               # 12 Drizzle table definitions
├── types.ts                # TypeScript type definitions
├── constants.ts            # Regime thresholds, default controller values
└── router.ts               # tRPC router — API endpoints
```

#### Regime Model

The ACS operates on a **five-regime model** that adapts the entire token economy based on a composite health score:

| Regime | Health Score | Emission | Staking APY | Conversion | Burn Rate | Behavior |
|--------|-------------|----------|-------------|------------|-----------|----------|
| **Launch** | Pre-TGE | Aggressive | 25% | 0.015 tok/pt | 2% | Bootstrap liquidity and participation |
| **Growth** | 0.40–0.70 | Standard | 18% | 0.012 tok/pt | 3% | Competitive rates to fuel growth |
| **Mature** | > 0.70 | Full | 12% | 0.010 tok/pt | 5% | Sustainable long-term parameters |
| **Contraction** | 0.20–0.40 | Reduced | 8% | 0.006 tok/pt | 10% | Defensive — preserve treasury value |
| **Emergency** | < 0.20 | Minimal | 5% | 0.003 tok/pt | 15% | Maximum deflationary pressure |

**Hysteresis bands** (±0.05) prevent rapid regime oscillation. Regime changes require sustained health score for ≥3 consecutive evaluation cycles (except Emergency, which transitions immediately).

#### Health Score Computation

```
Overall Health Score = (
    Liquidity Score    × 0.30 +     // Depth relative to market cap
    Velocity Score     × 0.25 +     // Volume/cap ratio (inverted — high velocity = low score)
    Concentration Score × 0.25 +    // Inverse of top-holder Gini coefficient
    Participation Score × 0.20      // Active users / total holders
)
```

Each sub-score is normalized to [0.0, 1.0]:

| Score | Formula | Signal |
|-------|---------|--------|
| Liquidity | `min(1, liquidityDepth / (marketCap × 0.05))` | Sufficient trading depth relative to cap |
| Velocity | `1 - min(1, volume24h / (marketCap × 0.5))` | Lower velocity = healthier (less speculation) |
| Concentration | `1 - min(1, topHolderPercent)` | Less concentration = healthier distribution |
| Participation | `min(1, activeUsers24h / totalHolders)` | Higher engagement = healthier community |

#### Controller Engine Architecture

Each controller follows a standardized lifecycle:

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Load Current   │    │  Compute Target  │    │  Apply           │
│  Controller     │───▶│  Value for       │───▶│  Dampening       │
│  State          │    │  Current Regime  │    │  (max 10% Δ)     │
└─────────────────┘    └──────────────────┘    └────────┬─────────┘
                                                         │
                       ┌──────────────────┐    ┌────────▼─────────┐
                       │  Persist + Emit  │◀───│  Clamp to        │
                       │  Audit Event     │    │  [min, max]      │
                       └──────────────────┘    └──────────────────┘
```

**Key properties:**
- **Dampening**: `newValue = currentValue + (targetValue - currentValue) × dampeningFactor`. No controller can change more than `maxChangePerCycle` (default 10%) per evaluation.
- **Cooldown**: Each controller has an `adjustmentCooldown` (default 3600s) — it won't adjust again within the cooldown window.
- **Override safety**: Manual overrides have mandatory expiry (max 168 hours). When an override is active, the automatic evaluation skips that controller. When the override expires, the controller reverts to automatic mode.
- **Bounds**: Every controller has hard `minValue` / `maxValue` bounds. The engine will never push a value outside these bounds, even under extreme market conditions.

#### Contribution Scoring Pipeline

```
User contributes something (code commit, article, referral, etc.)
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│  1. LOAD CONTRIBUTION TYPE                               │
│     Lookup type definition with scoring formula,          │
│     category weight, and quality factors                  │
│                                                           │
│  2. EVALUATE SCORING FORMULA (sandboxed — no eval())      │
│     rawScore = evaluate("linesAdded * 0.5 + complexity    │
│                          * 100", rawMetrics)               │
│                                                           │
│  3. APPLY QUALITY MULTIPLIER                              │
│     qualifiedScore = rawScore × qualityMultiplier         │
│     (from peer review, admin review, or automatic)        │
│                                                           │
│  4. APPLY CATEGORY WEIGHT                                 │
│     weightedScore = qualifiedScore × baseWeight           │
│     (code: 0.3, content: 0.25, referral: 0.2, etc.)      │
│                                                           │
│  5. APPLY TIME DECAY                                      │
│     decayedScore = weightedScore × decayFactor(age)       │
│     (exponential/linear/step/logarithmic)                 │
│                                                           │
│  6. CAP ENFORCEMENT                                       │
│     cappedScore = min(decayedScore, maxScorePerEntry)     │
│     finalScore = min(cappedScore, dailyRemaining)         │
│                                                           │
│  7. PERSIST + UPDATE AGGREGATES                           │
│     Insert contribution_entries row                        │
│     Upsert contribution_scores (aggregate per user)       │
│     Insert scoring_transparency_logs (full audit)         │
│                                                           │
│  8. INVALIDATE LEADERBOARD CACHE                          │
│     Delete Redis sorted set for affected venture/period   │
└─────────────────────────────────────────────────────────┘
```

#### Decay Functions

Four decay function implementations are supported:

| Function | Formula | Half-Life 90d, Age 90d | Best For |
|----------|---------|----------------------|----------|
| **Exponential** | `2^(-age / halfLife)` | 0.50 | Smooth, natural decay |
| **Linear** | `1 - age / (halfLife × 2)` | 0.50 | Simple, predictable |
| **Logarithmic** | `1 / (1 + ln(1 + age / halfLife))` | 0.59 | Slow initial decay |
| **Step** | Defined steps | Configurable | Gamified tier milestones |

All decay functions respect a `minimumRetention` floor (default 10%) — contributions never fully vanish.

#### Leaderboard Architecture

Leaderboards are computed and cached at two levels:

1. **PostgreSQL** (`acs_leaderboards` + `acs_leaderboard_entries`): Persistent storage, computed by cron (every 15min for weekly, every hour for monthly, daily for all-time).
2. **Redis Sorted Sets**: Real-time rank lookups with `O(log N)` complexity. Updated on every contribution scoring event. Key pattern: `leaderboard:{ventureId}:{periodKey}:{category}`.

```
Redis Structure:
  ZADD leaderboard:betedge:2026-W06:overall  <score> <userId>
  ZRANK leaderboard:betedge:2026-W06:overall <userId>  →  rank
  ZREVRANGE leaderboard:betedge:2026-W06:overall 0 49  →  top 50
```

---

### Launchpad — Token Launch & IDO/ICO Management

The Launchpad module handles the complete lifecycle of token sales — from configuration through purchase processing and vesting claims. It supports multiple sale types, integrates KYC/compliance, generates Merkle proofs for whitelist verification, and manages vesting schedules with on-chain settlement.

#### Submodule Structure

```
launchpad/
├── service.ts              # Public API — launchpadService, whitelistService,
│                           #   vestingService, launchAnalyticsService, fairLaunchService
├── merkle.ts               # Merkle tree construction, proof generation, verification
├── vesting.ts              # Vesting computation engine — claimable amounts, unlock schedules
├── fair-launch.ts          # Fair launch mechanism — proportional distribution
├── compliance/
│   ├── kyc.ts              # KYC verification integration (@mcv/identity)
│   └── jurisdiction.ts     # Jurisdiction exclusion enforcement
├── analytics/
│   ├── sale-stats.ts       # Sale statistics aggregation
│   └── participation.ts    # Participant analytics
├── schema.ts               # 10 Drizzle table definitions
├── types.ts                # TypeScript type definitions
├── constants.ts            # Sale types, statuses, default vesting intervals
└── router.ts               # tRPC router — API endpoints
```

#### Sale Types

| Type | Price Discovery | Allocation | Best For |
|------|----------------|------------|----------|
| **fixed_price** | None — admin sets price | First-come-first-served or tiered | Simple community sales |
| **dutch_auction** | Decreasing price curve — all pay clearing price | Everyone pays same final price | Fair price discovery |
| **lbp** | Liquidity Bootstrapping Pool — weight-shifting AMM | Market-driven | Large capital raises |
| **fair_launch** | Uniform — proportional to deposit | Equal distribution proportional to contribution | Maximum participation |
| **lottery** | None — weighted random selection | Random with tier weighting | High-demand management |

#### Sale Lifecycle State Machine

```
┌────────┐  submit   ┌──────────┐  approve  ┌──────────┐
│ DRAFT  │──────────▶│ PENDING  │─────────▶│ APPROVED │
└────────┘           │ APPROVAL │          └────┬─────┘
                     └─────┬────┘               │
                           │ reject             │ open whitelist
                           ▼                    ▼
                     ┌──────────┐         ┌──────────────┐
                     │CANCELLED │         │ WHITELIST    │
                     └──────────┘         │ OPEN         │
                                          └──────┬───────┘
                                                 │ sale starts
                                                 ▼
                                          ┌──────────────┐
                                          │   ACTIVE     │
                                          └──────┬───────┘
                                                 │ sale ends / hard cap
                                                 ▼
                                          ┌──────────────┐  finalize  ┌───────────┐
                                          │   ENDED      │──────────▶│ FINALIZED │
                                          └──────────────┘           └───────────┘
```

**Invariants:**
- Status transitions are strictly enforced — no skipping states.
- `PENDING_APPROVAL` requires admin action — prevents unauthorized launches.
- `FINALIZED` is terminal — no further mutations to the sale.
- `CANCELLED` can only be reached from `DRAFT` or `PENDING_APPROVAL`.

#### Merkle Whitelist Architecture

The whitelist system uses Merkle proofs for gas-efficient on-chain verification:

```
Admin uploads whitelist (N addresses)
        │
        ▼
┌──────────────────────────────────────────────────────┐
│  1. VALIDATE all wallet addresses (base58, 32-44 ch)  │
│                                                        │
│  2. HASH each leaf:                                    │
│     keccak256(encodePacked(                            │
│       walletAddress,                                   │
│       tier,           // 'guaranteed'|'lottery'|'fcfs'  │
│       maxAllocation   // scaled to 6 decimals (USDC)   │
│     ))                                                 │
│                                                        │
│  3. BUILD Merkle tree (sorted pairs for determinism)   │
│     ┌───────── ROOT ──────────┐                        │
│     │                         │                        │
│   ┌─┴─┐                   ┌──┴──┐                     │
│   │ H1│                   │ H2  │                     │
│   ├───┤                   ├─────┤                     │
│   │   │                   │     │                     │
│  ┌┴┐ ┌┴┐               ┌─┴┐  ┌─┴┐                   │
│  │A│ │B│               │C │  │D │    ← leaves        │
│  └─┘ └─┘               └──┘  └──┘                    │
│                                                        │
│  4. STORE snapshot in DB (root + full entry list)       │
│  5. CACHE root in Redis (24h TTL)                      │
└──────────────────────────────────────────────────────┘

At purchase time:
  User provides walletAddress + merkleProof[]
  Contract verifies: MerkleTree.verify(proof, leaf, root)
  O(log N) verification — scales to millions of addresses
```

**Key property**: The contract only stores a single 32-byte root hash. Each user provides their own proof at purchase time. This scales to millions of whitelisted addresses with constant on-chain storage.

#### Vesting Computation Engine

Vesting is computed deterministically using integer arithmetic (no floating-point drift):

```
Timeline:
├── TGE ──────── Cliff End ──── Vesting Period ──── End ──▶
│                │              │                    │
│  TGE Unlock    │  Nothing     │  Linear release    │  100%
│  (e.g., 10%)   │  claimable   │  per interval      │  vested
│                │              │                    │

Computation:
  tgeAmount      = totalAmount × tgeUnlockPercent
  vestingAmount  = totalAmount - tgeAmount
  totalPeriods   = ceil(vestingDurationSec / vestingIntervalSec)
  vestedPeriods  = min(floor(postCliffElapsed / intervalSec), totalPeriods)
  vestedAmount   = tgeAmount + (vestedPeriods / totalPeriods) × vestingAmount
  claimable      = vestedAmount - alreadyClaimed
```

---

### Rewards — Reward Distribution & Redemption Engine

The Rewards module is the primary user-facing interface of the token economy. It manages the complete reward lifecycle: point accrual from venture actions, reward program management, pool budgets, vesting schedules, claim workflows, anti-abuse detection, cross-venture rewards, and on-chain token distribution.

#### Submodule Structure

```
rewards/
├── service.ts              # Public API — rewardsService, distributionService,
│                           #   conversionService, antiGamingService, rewardPoolService,
│                           #   vestingRewardService
├── anti-gaming.ts          # Anti-gaming engine — 8 independent checks
├── distribution/
│   ├── batcher.ts          # Batch creation and recipient grouping
│   ├── executor.ts         # On-chain batch execution via @mcv/web3-core
│   ├── scheduler.ts        # Scheduled batch processing
│   └── retry.ts            # Failed transaction retry with exponential backoff
├── conversion/
│   ├── engine.ts           # Points-to-tokens conversion with ACS rate lookup
│   └── rules.ts            # Conversion rule management
├── pools/
│   ├── manager.ts          # Pool lifecycle — funding, allocation, depletion
│   └── emission.ts         # ACS-governed emission rate enforcement
├── tiers/
│   ├── calculator.ts       # Tier computation from lifetime points
│   └── benefits.ts         # Tier benefit application (multipliers, priority)
├── cross-venture/
│   ├── evaluator.ts        # Cross-venture rule evaluation engine
│   └── rules.ts            # Cross-venture rule management
├── schema.ts               # 16 Drizzle table definitions
├── types.ts                # TypeScript type definitions
├── constants.ts            # Point sources, tier thresholds, rate limits
└── router.ts               # tRPC router — API endpoints
```

#### Point Accrual Pipeline

```
Venture Action (e.g., bet_placed on BetEdge)
        │
        ▼
┌───────────────────────────────────────────────────────┐
│  1. ANTI-GAMING ENGINE (8 checks — ALL run in parallel) │
│     ┌────────────────────────────────────────────┐      │
│     │  Check 1: Rate Limit         score += 0.30 │      │
│     │  Check 2: Velocity Anomaly   score += 0.25 │      │
│     │  Check 3: Device Fingerprint score += 0.25 │      │
│     │  Check 4: IP Reputation      score += 0.15 │      │
│     │  Check 5: Referral Chain     score += 0.40 │      │
│     │  Check 6: Bot Detection      score += 0.35 │      │
│     │  Check 7: Sybil Correlation  score += 0.35 │      │
│     │  Check 8: Anomalous Value    score += 0.20 │      │
│     └────────────────────────────────────────────┘      │
│                                                          │
│  Score < 0.3 → ALLOW                                    │
│  Score 0.3–0.5 → FLAG (allow but flag for review)       │
│  Score 0.5–0.8 → HOLD (write entry, hold points)        │
│  Score ≥ 0.8 → BLOCK (reject entirely)                  │
│                                                          │
│  2. APPLY TIER MULTIPLIER                                │
│     finalAmount = amount × tierMultiplier                │
│     (bronze: 1.0×, silver: 1.1×, gold: 1.25×,           │
│      platinum: 1.5×, diamond: 2.0×)                      │
│                                                          │
│  3. WRITE POINT ENTRY (append-only, immutable)           │
│     INSERT INTO reward_point_entries (...)                │
│     NO UPDATE. NO DELETE. EVER.                          │
│                                                          │
│  4. ASYNC BALANCE UPDATE (via Redpanda queue)            │
│     ├── Update reward_point_balances in PostgreSQL       │
│     ├── SET Redis cache key immediately                  │
│     └── Recalculate tier if lifetime points crossed      │
│         threshold                                        │
│                                                          │
│  5. CROSS-VENTURE EVALUATION                             │
│     If action matches cross-venture rules, create bonus  │
│     point entries in target ventures                     │
└───────────────────────────────────────────────────────┘
```

#### Tier System

```
Tier Thresholds (lifetime points):
  ┌──────────┬──────────┬────────────┬────────────────┬──────────────┐
  │  BRONZE  │  SILVER  │    GOLD    │   PLATINUM     │   DIAMOND    │
  │    0     │  10,000  │   50,000   │    200,000     │  1,000,000   │
  ├──────────┼──────────┼────────────┼────────────────┼──────────────┤
  │  1.00×   │  1.10×   │   1.25×    │    1.50×       │    2.00×     │
  │  No conv │  +5% conv│  +10% conv │  +15% conv     │  +25% conv   │
  │  bonus   │  bonus   │  Priority  │  Priority +    │  Priority +  │
  │          │          │  claims    │  Exclusive pgms│  Exclusive   │
  └──────────┴──────────┴────────────┴────────────────┴──────────────┘

Upgrade: Immediate when lifetime points cross threshold
Downgrade: Only when tierExpiresAt passes (90-day rolling window)
```

#### Claim Workflow State Machine

```
User requests claim
        │
        ▼
┌──────────┐     verify wallet     ┌──────────────┐
│ PENDING  │──────────────────────▶│ SIG_VERIFIED │
└──────────┘                       └──────┬───────┘
                                          │ verify identity
                                          ▼
                                   ┌──────────────┐
                                   │ ID_VERIFIED  │
                                   └──────┬───────┘
                                          │
                          ┌───────────────┼──────────────────┐
                          │               │                  │
                     amount ≤ threshold   │           amount > threshold
                          │               │                  │
                          ▼               │                  ▼
                   ┌──────────────┐       │          ┌───────────────┐
                   │  PROCESSING  │       │          │ NEEDS_APPROVAL│
                   │  (auto-send) │       │          └───────┬───────┘
                   └──────┬───────┘       │                  │ approved
                          │               │                  ▼
                          │               │          ┌───────────────┐
                          │               │          │  PROCESSING   │
                          │               │          └───────┬───────┘
                          │               │                  │
                          ▼               │                  ▼
                   ┌──────────────┐       │          ┌──────────────┐
                   │  CONFIRMED   │◀──────┘          │  CONFIRMED   │
                   │  (on-chain)  │                  │  (on-chain)  │
                   └──────┬───────┘                  └──────────────┘
                          │
                     tx failed?
                          │
                          ▼
                   ┌──────────────┐  retry (≤3×)  ┌──────────────┐
                   │   FAILED     │──────────────▶│  PROCESSING  │
                   └──────────────┘               └──────────────┘
```

#### Distribution Batching

Token distributions are batched for Solana fee efficiency:

```
Distribution Batch Pipeline:
  1. Accumulate recipients (up to MAX_BATCH_SIZE = 500)
  2. Create batch record with total amount
  3. If totalAmount > APPROVAL_THRESHOLD ($10,000):
     → Require explicit admin approval
  4. Sign transactions with treasury wallet
  5. Submit to Solana as compressed transactions
  6. Poll for confirmation (commitment: 'confirmed')
  7. Update recipient statuses (confirmed / failed)
  8. Retry failed recipients (up to 3 attempts, exponential backoff)
```

#### Reward Pool Budget Enforcement

```
Treasury ─── fund ──▶ Pool (total_budget)
                       │
                       ├── allocate 40% → BetEdge rewards
                       ├── allocate 25% → SerpSpace rewards
                       ├── allocate 15% → Full Gain rewards
                       ├── allocate 10% → MCV Studios rewards
                       └── allocate 10% → Cross-venture rewards

Emission Rate (ACS-governed per regime):
  Launch:      100,000 EDGE/day
  Growth:       75,000 EDGE/day
  Mature:       50,000 EDGE/day
  Contraction:  25,000 EDGE/day
  Emergency:    10,000 EDGE/day

Pool Status Transitions:
  active ──(budget < 10%)──▶ warning ──(budget = 0)──▶ depleted
  active ──(manual)──▶ paused ──(manual)──▶ active
  depleted ──(refund)──▶ active
```

---

## Data Models

### Database Schema Overview

The `@mcv/token-economy` package defines **38 tables** across three sub-modules, all using Drizzle ORM with PostgreSQL and Supabase RLS.

#### Rewards Tables (16)

| Table | Purpose | Key Columns | Constraints |
|-------|---------|-------------|-------------|
| `reward_point_entries` | **Immutable** append-only point ledger | userId, ventureId, source, amount, finalAmount, flagged | NO UPDATE/DELETE; indexes on user, venture+user, source, created, flagged, program, pool |
| `reward_point_balances` | Materialized balance snapshots | userId, ventureId, currentBalance, lifetimePoints, currentTier | UNIQUE on (ventureId, userId); async update via queue |
| `reward_programs` | Reward program definitions | name, slug, type, status, budget, eligibilityRules, earnRules | UNIQUE on (ventureId, slug); 7 program types, 7 statuses |
| `reward_program_participants` | Program enrollment tracking | programId, userId, status, earnedAmount, claimedAmount | UNIQUE on (programId, userId) |
| `reward_pools` | Token reward pool budgets | tokenMint, totalBudget, allocatedAmount, distributedAmount, treasuryAddress | Status: active/depleted/paused/closed; ACS-governed emission |
| `reward_pool_allocations` | Per-venture pool allocations | poolId, ventureId, allocationPercent | UNIQUE on (poolId, ventureId) |
| `reward_vesting_schedules` | Reward vesting configurations | vestingType, totalAmount, tgeUnlockPercent, cliffDurationSec, vestingDurationSec | Types: linear, cliff_linear, graded, immediate |
| `reward_claims` | Claim history and status | userId, claimType, tokenAmount, walletAddress, txSignature, status | Status: pending/processing/confirmed/failed/cancelled; max 3 retries |
| `reward_distribution_batches` | On-chain distribution batches | recipientCount, totalAmount, status, txSignatures, requiresApproval | Approval required > $10K; batch up to 500 recipients |
| `reward_distribution_recipients` | Individual distribution records | batchId, walletAddress, amount, txSignature, status | Status: pending/sent/confirmed/failed |
| `reward_conversion_rules` | Points→tokens conversion rules | pointsRequired, tokensReceived, baseRate, currentRate (ACS-adjusted) | Limits: minPoints, maxPoints, maxConversionsPerUser, dailyCap |
| `reward_conversion_history` | Conversion transaction history | userId, pointsConverted, tokensReceived, conversionRate, regime | Records ACS regime at conversion time |
| `reward_abuse_flags` | Flagged suspicious activity | flagType, severity, sybilScore, confidence, evidence, affectedPointsTotal | 7 flag types; severity: low/medium/high/critical |
| `reward_cross_venture_rules` | Cross-venture reward mappings | sourceVentureId, sourceAction, targetVentureId, multiplier, bonusPoints | Conditions: minAmount, maxPerDay, requireBothVentureActive |

#### ACS Tables (12)

| Table | Purpose | Key Columns | Constraints |
|-------|---------|-------------|-------------|
| `acs_state` | Current ACS system state | currentRegime, overallHealth, liquidityScore, velocityScore, concentrationScore | One row per economy; cached in Redis (5min TTL) |
| `acs_controller` | Controller configurations | name, category, currentValue, targetValue, minValue, maxValue, dampeningFactor | UNIQUE on (economyId, name); 5 categories |
| `acs_evaluation` | Evaluation history | regime, regimeChanged, inputMetrics, scores, adjustments | Indexed by economyId + evaluatedAt; filter on regimeChanged |
| `acs_audit_log` | ACS audit trail | action, controllerId, oldValue, newValue, triggeredBy, actorId | 6 action types; triggeredBy: automatic/manual/governance/emergency |
| `acs_contribution_entries` | Raw contribution records | userId, contributionType, category, rawMetrics, rawScore, weightedScore | 8 contribution types; 5 categories; quality multiplier |
| `acs_contribution_scores` | Aggregated contribution scores per user | codeScore, contentScore, referralScore, totalScore, rank, percentile | UNIQUE on (ventureId, userId); indexed by decayedTotalScore |
| `acs_contribution_types` | Contribution type definitions | name, category, baseWeight, scoringFormula, maxScorePerEntry | Configurable per venture or ecosystem-wide |
| `acs_score_snapshots` | Periodic score snapshots | userId, period, periodType, scores, rank, percentile | UNIQUE on (ventureId, userId, period); weekly/monthly/quarterly |
| `acs_leaderboards` | Leaderboard cache table | ventureId, period, periodKey, category, entryCount | UNIQUE on (ventureId, periodKey, category) |
| `acs_leaderboard_entries` | Individual leaderboard positions | leaderboardId, userId, rank, score, previousRank, rankChange | Indexed by (leaderboardId, rank) and userId |
| `acs_decay_configurations` | Decay function parameters | decayFunction, halfLifeDays, minimumRetention, decayStartDays | 4 function types; step function config via JSON |
| `acs_scoring_transparency_logs` | Scoring explanation logs | userId, contributionEntryId, explanation (full breakdown) | User-accessible audit trail for their own scores |

#### Launchpad Tables (10)

| Table | Purpose | Key Columns | Constraints |
|-------|---------|-------------|-------------|
| `launchpad_sale` | Token sale definitions | name, type, status, totalTokens, price, hardCap, softCap, whitelistRoot | 5 sale types; 8 statuses; KYC/jurisdiction enforcement |
| `launchpad_vesting_schedule` | Vesting schedule configurations | saleId, tgeUnlockPercent, cliffDuration, vestingDuration, vestingInterval | One or more schedules per sale (seed, strategic, public) |
| `launchpad_allocation` | User allocation records | saleId, walletAddress, whitelistTier, maxAllocation, purchasedAmount, totalClaimed | Merkle proof stored per user; KYC verification tracked |
| `launchpad_purchase` | Purchase transaction log | saleId, allocationId, paymentAmount, tokenAmount, txSignature | Immutable purchase record with on-chain reference |
| `launchpad_claim` | Claim transaction log | allocationId, claimableAmount, claimedAmount, vestingPeriod, txSignature | Tracks which vesting period each claim covers |
| `launchpad_whitelist_entries` | Raw whitelist data | saleId, walletAddress, tier, maxAllocation | Bulk upload by admin |
| `launchpad_whitelist_snapshots` | Merkle tree snapshots | saleId, merkleRoot, leafCount, treeDepth, entries | New snapshot created on each whitelist update |
| `launchpad_sale_analytics` | Aggregated sale metrics | saleId, totalRaised, uniqueParticipants, avgContribution | Updated after each purchase |
| `launchpad_fair_launch_configs` | Fair launch parameters | saleId, depositWindowSec, minDeposit, maxDeposit, allocationFormula | Proportional distribution configuration |
| `launchpad_secondary_market_bootstrap` | Liquidity bootstrapping configs | saleId, strategy, initialLiquidity, targetPrice, bootstrapDuration | Post-sale DEX liquidity setup |

### Entity Relationship Overview

```
                    ┌──────────────────────┐
                    │   reward_programs     │
                    │                      │
                    │  budget, earnRules,  │
                    │  eligibilityRules    │
                    └──────────┬───────────┘
                               │ 1:N
                    ┌──────────▼───────────┐
                    │ program_participants  │
                    │                      │
                    │  earnedAmount,       │
                    │  claimedAmount       │
                    └──────────────────────┘

  ┌────────────────┐          ┌────────────────┐          ┌────────────────┐
  │  point_entries  │          │ point_balances  │          │ reward_pools   │
  │  (append-only) │  update  │  (materialized) │          │                │
  │                │────────▶│                │          │  totalBudget,  │
  │  source, amt,  │  async   │  currentBalance│          │  allocations,  │
  │  flagged       │  queue   │  lifetimePoints│          │  emissionRate  │
  └────────────────┘          │  currentTier   │          └───────┬────────┘
                              └────────────────┘                  │ 1:N
                                                        ┌────────▼────────┐
                                                        │ pool_allocations │
                                                        │  per venture     │
                                                        └─────────────────┘

  ┌────────────────┐          ┌──────────────────┐        ┌────────────────┐
  │ conversion_    │          │ distribution_    │        │ reward_claims  │
  │ rules          │          │ batches          │        │                │
  │                │          │                  │        │  claimType,    │
  │  baseRate,     │          │  recipientCount, │        │  tokenAmount,  │
  │  currentRate   │          │  totalAmount,    │        │  txSignature,  │
  │  (ACS-adjusted)│          │  requiresApproval│        │  status        │
  └────────────────┘          └────────┬─────────┘        └────────────────┘
                                       │ 1:N
                              ┌────────▼─────────┐
                              │ distribution_    │
                              │ recipients       │
                              │                  │
                              │  walletAddress,  │
                              │  amount, status  │
                              └──────────────────┘

ACS:
  ┌──────────────┐  governs   ┌───────────────┐  log    ┌────────────────┐
  │  acs_state   │───────────▶│ acs_controllers│───────▶│ acs_evaluations│
  │              │            │               │        │                │
  │  regime,     │            │  currentValue,│        │  regime, scores│
  │  health      │            │  dampening,   │        │  adjustments   │
  │  scores      │            │  bounds       │        │                │
  └──────────────┘            └───────────────┘        └────────────────┘

  ┌──────────────────┐  score  ┌───────────────────┐  cache  ┌──────────────┐
  │ contribution_    │────────▶│ contribution_     │───────▶│ leaderboards │
  │ entries          │        │ scores (aggregate) │        │ + entries    │
  └──────────────────┘        └───────────────────┘        └──────────────┘

Launchpad:
  ┌──────────────┐  has   ┌──────────────────┐  tracks  ┌────────────────┐
  │ token_sales  │───────▶│ vesting_schedules│────────▶│ user_          │
  │              │        │                  │        │ allocations    │
  │  type,       │        │  tgeUnlock,      │        │                │
  │  status,     │        │  cliff, duration │        │  purchased,    │
  │  hardCap     │        │                  │        │  claimed       │
  └──────┬───────┘        └──────────────────┘        └────────┬───────┘
         │                                                      │
         │  whitelist                                    ┌──────▼───────┐
         ▼                                               │  purchase_   │
  ┌──────────────────┐                                   │  transactions│
  │ whitelist_       │                                   └──────────────┘
  │ snapshots        │
  │  merkleRoot      │
  └──────────────────┘
```

---

## Data Flow & Events

### Event Taxonomy

All events emitted by `@mcv/token-economy` flow through the `@mcv/fabric` event bus and are captured in the audit trail.

#### Rewards Events

| Event | Severity | Payload | Trigger |
|-------|----------|---------|---------|
| `rewards.points.accrued` | info | userId, source, amount, finalAmount, balance | Successful point accrual |
| `rewards.points.blocked` | warning | userId, source, amount, reason, abuseScore | Anti-gaming engine blocked |
| `rewards.points.held` | warning | userId, source, amount, flags | Points held for review |
| `rewards.program.created` | info | programId, name, type, budget | New reward program |
| `rewards.program.activated` | info | programId | Program goes live |
| `rewards.program.paused` | warning | programId, reason | Admin pauses program |
| `rewards.pool.created` | info | poolId, budget, fundingSource | New reward pool funded |
| `rewards.pool.depleted` | warning | poolId, totalDistributed | Pool budget exhausted |
| `rewards.claim.initiated` | info | userId, claimType, amount | User requests claim |
| `rewards.claim.confirmed` | info | claimId, txSignature, amount | On-chain settlement confirmed |
| `rewards.claim.failed` | error | claimId, error, retryCount | Transaction failed |
| `rewards.distribution.created` | info | batchId, recipientCount, totalAmount | New distribution batch |
| `rewards.distribution.approved` | info | batchId, approvedBy | Batch approved for execution |
| `rewards.distribution.completed` | info | batchId, confirmedCount, totalAmount | All recipients settled |
| `rewards.conversion.completed` | info | userId, points, tokens, rate, regime | Successful point→token conversion |
| `rewards.abuse.flagged` | warning | userId, flagType, severity, score | Abuse pattern detected |
| `rewards.abuse.resolved` | info | flagId, resolution, action | Abuse flag resolved |

#### ACS Events

| Event | Severity | Payload | Trigger |
|-------|----------|---------|---------|
| `acs.evaluation.completed` | info | economyId, regime, scores, adjustments | Evaluation cycle completed |
| `acs.regime.changed` | warning | economyId, from, to, health | Regime transition |
| `acs.parameter.adjusted` | info | economyId, controller, oldValue, newValue | Controller value updated |
| `acs.override.set` | warning | controllerId, value, expiry, reason, actor | Manual override activated |
| `acs.override.cleared` | info | controllerId, reason, actor | Override removed |
| `acs.override.expired` | info | controllerId | Override TTL elapsed |
| `acs.contribution.scored` | info | userId, type, rawScore, finalScore | Contribution scored |
| `acs.leaderboard.computed` | info | ventureId, period, entryCount | Leaderboard recomputed |
| `acs.decay.applied` | info | ventureId, usersAffected, totalDecayAmount | Batch decay applied |

#### Launchpad Events

| Event | Severity | Payload | Trigger |
|-------|----------|---------|---------|
| `launch.sale.created` | info | saleId, name, type, hardCap | New sale configured |
| `launch.sale.approved` | info | saleId, approvedBy | Sale approved for launch |
| `launch.sale.activated` | info | saleId, saleStart | Sale goes live |
| `launch.sale.ended` | info | saleId, raised, participants | Sale period ends |
| `launch.sale.finalized` | info | saleId, finalAmount | Sale finalized |
| `launch.whitelist.uploaded` | info | saleId, entryCount, merkleRoot | Whitelist updated |
| `launch.purchase.completed` | info | saleId, userId, amount, txSignature | Token purchase confirmed |
| `launch.purchase.failed` | error | saleId, userId, error | Purchase transaction failed |
| `launch.vesting.claimed` | info | allocationId, amount, txSignature | Vested tokens claimed |

### Data Flow: ACS Evaluation Cycle

```
Cron trigger (every 15 minutes)
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│  1. LOAD STATE from acs_state (cache-first, 5min TTL)   │
│                                                          │
│  2. FETCH METRICS from external oracles:                 │
│     ├── Jupiter: price, volume, liquidity depth          │
│     ├── Birdeye: holder analytics, top-holder %          │
│     └── Solana RPC: staking ratio, circulating supply    │
│                                                          │
│  3. CALCULATE HEALTH SCORES                              │
│     liquidityScore   = min(1, depth / (cap × 0.05))     │
│     velocityScore    = 1 - min(1, vol24h / (cap × 0.5)) │
│     concentrationScore = 1 - min(1, topHolderPct)        │
│     participationScore = min(1, activeUsers / holders)   │
│     overallHealth    = weighted average (30/25/25/20)     │
│                                                          │
│  4. DETERMINE REGIME (with hysteresis)                   │
│     ├── Check if candidate regime differs from current   │
│     ├── Require ≥3 consecutive evals in new band         │
│     ├── Emergency transitions immediately (no delay)     │
│     └── Emit acs.regime.changed if transition occurs     │
│                                                          │
│  5. RUN ALL CONTROLLERS                                  │
│     ├── StakingApyController                             │
│     ├── EmissionRateController                           │
│     ├── ConversionRateController                         │
│     └── BurnRateController                               │
│     (skip controllers with active overrides or cooldown) │
│                                                          │
│  6. APPLY ADJUSTMENTS (single DB transaction)            │
│     ├── Update acs_state (regime, scores, metrics)       │
│     ├── Update acs_controller rows (new values)          │
│     ├── Insert acs_evaluation record                     │
│     └── Insert acs_audit_log entries                     │
│                                                          │
│  7. EMIT EVENTS via @mcv/fabric                          │
│     ├── acs.evaluation.completed (always)                │
│     ├── acs.regime.changed (if transition)               │
│     └── acs.parameter.adjusted (per controller change)   │
│                                                          │
│  8. INVALIDATE CACHES                                    │
│     ├── acs:state:{economyId}                            │
│     ├── acs:controllers:{economyId}                      │
│     └── acs:controller:{controllerId} (per adjustment)   │
└─────────────────────────────────────────────────────────┘
```

### Data Flow: Token Minting / Burning

Token minting and burning are governed by ACS-controlled emission and burn rates:

```
MINTING (Emission):
  ACS emissionRate (tokens/day) → Reward Pool emission cap
        │
        ▼
  Pool distributes to venture allocations
        │
        ▼
  Users earn points → Convert via conversionRate → Distribution batch
        │
        ▼
  @mcv/web3-core: SPL token transfer from treasury to user wallet
        │
        ▼
  Solana TX confirmed → reward_claims.status = 'confirmed'

BURNING (Deflation):
  Transaction fees → burnRate % sent to burn address
        │
        ▼
  @mcv/web3-core: SPL token transfer to burn address (0x000...dead)
        │
        ▼
  Reduce circulating supply → ACS velocity/liquidity scores adjust
        │
        ▼
  Next evaluation cycle picks up reduced supply metrics
```

### Data Flow: Vesting Unlock

```
Cron: Check vesting schedules (every hour)
        │
        ▼
┌──────────────────────────────────────────────────────┐
│  For each active vesting schedule:                    │
│    1. Compute current claimable per user              │
│    2. If new tokens have vested since last check:     │
│       └── Emit launch.vesting.unlocked event          │
│    3. Users can call claimVested() at any time        │
│       ├── Compute claimable amount                    │
│       ├── Verify wallet signature                     │
│       ├── Submit Solana TX via @mcv/web3-core         │
│       ├── Update launchpad_claim record               │
│       └── Update launchpad_allocation.totalClaimed    │
└──────────────────────────────────────────────────────┘
```

---

## Integration Points

### Internal Package Dependencies

| Package | Integration | Direction | Data Flow |
|---------|------------|-----------|-----------|
| **@mcv/web3-core** | Token operations, wallet management, staking, SPL transfers | Outbound | Distribution batches → SPL transfers; Vesting claims → token delivery; Staking deposits → APY calculation |
| **@mcv/engagement** | Points/achievements trigger reward accrual | Inbound | engagement.action.completed → rewardsService.accruePoints() |
| **@mcv/identity** | User verification, KYC status, session management | Outbound | Claim workflows verify KYC status; Launchpad enforces KYC; Anti-gaming correlates user identities |
| **@mcv/fabric** | Event bus, audit trail, background job processing | Bidirectional | Venture actions → fabric events → reward accrual; Token-economy events → audit trail; Background jobs for decay, batch processing |
| **@mcv/db** | Database connection and migration management | Outbound | All 38 tables defined via Drizzle ORM; Migrations managed centrally |

### External Service Dependencies

| Service | Purpose | Integration Pattern |
|---------|---------|-------------------|
| **Solana RPC** | Transaction submission, confirmation polling, account queries | JSON-RPC via @solana/web3.js; commitment level: 'confirmed' |
| **Jupiter** | Token price, volume, liquidity depth | REST API for market metrics (ACS evaluation) |
| **Birdeye** | Holder analytics, top-holder concentration | REST API for concentration metrics |
| **@streamflow/stream** | Vesting stream contracts | SDK for creating and managing vesting streams |
| **Redis** | Caching, rate limiting, leaderboard sorted sets | ioredis client; multiple key patterns |
| **Redpanda/Kafka** | Async message processing | Balance updates, distribution processing, decay computation |

### Integration Patterns

#### Fabric Event Consumption

```typescript
// Venture action → Fabric event → Token Economy
fabric.on('engagement.action.completed', async (event) => {
  const { userId, ventureId, actionType, actionId, metadata } = event;

  // Map venture action to point source
  const source = mapActionToPointSource(actionType);
  if (!source) return; // Not all actions earn points

  // Look up earn rules for this action in active programs
  const earnRules = await getActiveEarnRules(ventureId, source);

  for (const rule of earnRules) {
    await rewardsService.accruePoints({
      userId,
      ventureId,
      source,
      sourceId: actionId,
      amount: calculateAmount(rule, metadata),
      programId: rule.programId,
      metadata,
    });
  }
});
```

#### Web3-Core Token Distribution

```typescript
// Token Economy → Web3-Core → Solana
async function executeBatch(batch: DistributionBatch): Promise<void> {
  const recipients = await getRecipients(batch.id);

  // Group into Solana-optimal transaction sizes
  const txGroups = chunkRecipients(recipients, 20); // ~20 transfers per TX

  for (const group of txGroups) {
    const tx = await web3Core.buildBatchTransfer({
      tokenMint: batch.tokenMint,
      from: batch.treasuryAddress,
      recipients: group.map(r => ({
        to: r.walletAddress,
        amount: r.amount,
      })),
    });

    const signature = await web3Core.signAndSend(tx);

    // Update recipient records
    for (const recipient of group) {
      await updateRecipientStatus(recipient.id, 'sent', signature);
    }

    // Poll for confirmation
    await web3Core.confirmTransaction(signature, 'confirmed');

    for (const recipient of group) {
      await updateRecipientStatus(recipient.id, 'confirmed', signature);
    }
  }
}
```

---

## Performance

### Performance Requirements

| Operation | Target Latency | Throughput | Pattern |
|-----------|---------------|------------|---------|
| Point accrual | < 100ms (p99) | 10,000 ops/sec | Write-heavy; append-only; async balance update |
| Balance query | < 20ms (p99) | 50,000 ops/sec | Read-heavy; Redis cache-first |
| Leaderboard query | < 50ms (p99) | 10,000 ops/sec | Redis sorted set; O(log N) rank lookup |
| ACS evaluation | < 5s (p99) | 4/hour | Batch computation; 4 controller runs per cycle |
| Contribution scoring | < 200ms (p99) | 5,000 ops/sec | Formula evaluation + DB write + cache invalidation |
| Conversion preview | < 30ms (p99) | 10,000 ops/sec | ACS rate lookup (cached) + arithmetic |
| Claim initiation | < 500ms (p99) | 1,000 ops/sec | Wallet verification + identity check + queue |
| Distribution batch | < 30s per batch | 500 recipients/batch | Batched Solana TXs; parallel submission |
| Whitelist verification | < 10ms (p99) | 50,000 ops/sec | In-memory Merkle proof verification |

### Optimization Strategies

#### Write Path: Point Accrual

```
Optimization: Decouple entry write from balance update

  1. Point entry INSERT → synchronous (append-only, fast)
  2. Redis balance SET → synchronous (immediate read consistency)
  3. PostgreSQL balance UPDATE → async via Redpanda queue (eventual)
  4. Tier recalculation → async (only on threshold crossing)

Result: Accrual completes in <50ms; balance eventually consistent within 2s
```

#### Read Path: Balance & Leaderboard

```
Optimization: Multi-layer caching

  L1: Redis (TTL: indefinite for balances, 15min for leaderboards)
      ├── point:balance:{ventureId}:{userId} → current balance
      ├── leaderboard:{ventureId}:{period}:{category} → sorted set
      └── acs:state:{economyId} → current regime + rates

  L2: PostgreSQL (source of truth)
      ├── reward_point_balances → materialized view
      ├── acs_leaderboard_entries → computed cache table
      └── acs_state → authoritative state

  Cache invalidation:
      ├── Balance: SET on every accrual; UPDATE on queue processing
      ├── Leaderboard: DEL on contribution scoring; recompute via cron
      └── ACS state: DEL on every evaluation cycle
```

#### Batch Path: Distribution

```
Optimization: Batch and compress Solana transactions

  1. Accumulate up to 500 recipients per batch
  2. Group into sub-batches of ~20 recipients per Solana TX
  3. Use versioned transactions with address lookup tables
  4. Submit sub-batches in parallel (max 5 concurrent)
  5. Confirmation polling with exponential backoff

Result: 500-recipient batch completes in <30 seconds
```

### Hot Path Analysis

The three hottest paths in the system:

1. **Point accrual** (highest volume): Optimized via append-only writes, async balance updates, and Redis caching. Anti-gaming checks run in parallel where possible.

2. **Balance queries** (highest read frequency): Redis-first with automatic fallback to PostgreSQL. Balance never stale by more than 2 seconds after the most recent accrual.

3. **Leaderboard queries** (most complex reads): Redis sorted sets provide O(log N) rank lookups. Full recomputation runs on a schedule (not triggered by every write).

---

## Scalability

### Horizontal Scaling Strategy

```
┌──────────────────────────────────────────────────────────┐
│                    SCALING DIMENSIONS                      │
│                                                            │
│  Dimension          Strategy                               │
│  ─────────────────────────────────────────────────────── │
│  Point accrual      Partition by ventureId; multiple       │
│  throughput         API server instances behind LB         │
│                                                            │
│  Balance reads      Redis cluster with read replicas       │
│                                                            │
│  Leaderboard        Shard by ventureId + period;           │
│  computation        parallel computation workers           │
│                                                            │
│  Distribution       Queue-based worker pool; scale         │
│  processing         workers independently                  │
│                                                            │
│  ACS evaluation     Single-writer (consistency);           │
│                     scale metrics providers                │
│                                                            │
│  Point entries      Time-based partitioning                │
│  storage            (monthly partitions)                   │
│                                                            │
│  Anti-gaming        Redis-based sliding windows;           │
│  checks             scale with Redis cluster               │
└──────────────────────────────────────────────────────────┘
```

### Database Partitioning

The `reward_point_entries` table is the fastest-growing table and will be partitioned:

```sql
-- Time-based partitioning (monthly)
CREATE TABLE reward_point_entries (
    ...
) PARTITION BY RANGE (created_at);

CREATE TABLE reward_point_entries_2026_01
    PARTITION OF reward_point_entries
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE reward_point_entries_2026_02
    PARTITION OF reward_point_entries
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- ... auto-created by migration cron
```

**Growth projections:**
- 9 ventures × 10,000 daily active users × 5 actions/day = ~450,000 entries/day
- Monthly partition: ~13.5M rows
- With indexes: ~2GB per partition
- Retention: 24 months active, archive older partitions to cold storage

### Queue-Based Scaling

```
Redpanda Topics:
  ├── token-economy.balance-updates     (partitioned by userId hash)
  │   └── Consumers: 4–16 workers (scale with accrual volume)
  │
  ├── token-economy.distributions       (partitioned by batchId)
  │   └── Consumers: 2–8 workers (scale with batch frequency)
  │
  ├── token-economy.decay-computation   (partitioned by ventureId)
  │   └── Consumers: 1–4 workers (daily batch job)
  │
  └── token-economy.leaderboard-recompute (partitioned by ventureId)
      └── Consumers: 1–4 workers (triggered by cron)
```

---

## Error Handling

### Error Code Registry

All errors follow a structured format with module prefix:

#### Rewards Errors

| Code | HTTP | Description | Recovery |
|------|------|-------------|----------|
| `REWARD_INSUFFICIENT_BALANCE` | 400 | Not enough points to convert/redeem | Show balance, suggest earning |
| `REWARD_RATE_LIMITED` | 429 | Too many accrual requests | Respect Retry-After header |
| `REWARD_BLOCKED_ABUSE` | 403 | Anti-gaming engine blocked request | Log incident; no auto-retry |
| `REWARD_HELD_FOR_REVIEW` | 202 | Points accrued but held for review | Accepted — async resolution |
| `REWARD_PROGRAM_NOT_FOUND` | 404 | Program ID does not exist | Check ID; refresh program list |
| `REWARD_PROGRAM_INACTIVE` | 409 | Program not in active status | Check program status/dates |
| `REWARD_PROGRAM_FULL` | 409 | Max participants reached | Monitor for re-opening |
| `REWARD_NOT_ELIGIBLE` | 403 | User doesn't meet eligibility | Show requirements |
| `REWARD_POOL_DEPLETED` | 409 | Reward pool has no remaining budget | Monitor for refund |
| `REWARD_CLAIM_FAILED` | 500 | On-chain claim transaction failed | Auto-retry (up to 3×) |
| `REWARD_CLAIM_NOTHING` | 400 | No claimable amount available | Show vesting schedule |
| `REWARD_CONVERSION_LIMIT` | 429 | Conversion limit reached | Show next reset time |
| `REWARD_KYC_REQUIRED` | 403 | KYC verification needed | Redirect to KYC flow |
| `REWARD_WALLET_REQUIRED` | 400 | Must connect wallet first | Prompt wallet connection |

#### ACS Errors

| Code | HTTP | Description | Recovery |
|------|------|-------------|----------|
| `ACS_STATE_NOT_FOUND` | 404 | Economy ACS state not initialized | Initialize ACS state for economy |
| `ACS_CONTROLLER_NOT_FOUND` | 404 | Controller ID does not exist | Check controller list |
| `ACS_OVERRIDE_ACTIVE` | 409 | Cannot auto-adjust — override active | Wait for expiry or clear manually |
| `ACS_EVALUATION_FAILED` | 500 | Evaluation engine error | Check metrics providers; retry |
| `ACS_COOLDOWN_ACTIVE` | 429 | Controller cooldown not elapsed | Wait for cooldown period |
| `ACS_CONTRIBUTION_TYPE_UNKNOWN` | 400 | Unknown contribution type | Check registered types |
| `ACS_SCORE_LIMIT_REACHED` | 429 | Daily scoring limit for user | Reset at midnight UTC |

#### Launchpad Errors

| Code | HTTP | Description | Recovery |
|------|------|-------------|----------|
| `LAUNCH_SALE_NOT_FOUND` | 404 | Sale ID does not exist | Check sale list |
| `LAUNCH_SALE_NOT_ACTIVE` | 409 | Sale not in active status | Wait for activation |
| `LAUNCH_SALE_ENDED` | 409 | Sale period has ended | Check upcoming sales |
| `LAUNCH_HARD_CAP_REACHED` | 409 | Sale hard cap reached | No recovery — sale complete |
| `LAUNCH_NOT_WHITELISTED` | 403 | Wallet not on whitelist | Apply for whitelist |
| `LAUNCH_INVALID_PROOF` | 400 | Merkle proof verification failed | Re-fetch proof |
| `LAUNCH_KYC_REQUIRED` | 403 | KYC required for sale | Complete KYC |
| `LAUNCH_JURISDICTION_BLOCKED` | 403 | User jurisdiction excluded | No recovery — regulatory |
| `LAUNCH_BELOW_MINIMUM` | 400 | Below minimum contribution | Increase amount |
| `LAUNCH_ABOVE_MAXIMUM` | 400 | Above maximum contribution | Reduce amount |
| `LAUNCH_VESTING_NOTHING` | 400 | No vested tokens to claim | Wait for next vesting period |
| `LAUNCH_PURCHASE_FAILED` | 500 | On-chain purchase TX failed | Retry with fresh TX |

### Retry Strategies

| Operation | Max Retries | Backoff | Timeout |
|-----------|------------|---------|---------|
| Point accrual (anti-gaming timeout) | 0 | N/A | 5s — fail open on timeout |
| Balance update (queue) | 5 | Exponential (1s, 2s, 4s, 8s, 16s) | 30s per attempt |
| Distribution TX submission | 3 | Exponential (5s, 15s, 45s) | 60s per attempt |
| Claim TX submission | 3 | Exponential (5s, 15s, 45s) | 60s per attempt |
| ACS metrics fetch | 3 | Linear (2s, 4s, 6s) | 10s per attempt |
| Leaderboard computation | 2 | Fixed (30s) | 120s per attempt |

### Circuit Breaker Pattern

Critical external dependencies use circuit breakers:

```typescript
// Solana RPC circuit breaker
const solanaBreaker = new CircuitBreaker({
  failureThreshold: 5,        // Open after 5 consecutive failures
  resetTimeout: 60_000,       // Try again after 60s
  halfOpenRequests: 1,        // Allow 1 test request in half-open
  monitorInterval: 30_000,    // Check health every 30s
});

// When open: queue distributions instead of failing
// When half-open: test with smallest batch first
// When closed: normal operation
```

---

## Observability

### Metrics

All metrics are exported in OpenTelemetry format:

#### Rewards Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `token_economy.points.accrued_total` | Counter | ventureId, source | Total points accrued |
| `token_economy.points.blocked_total` | Counter | ventureId, reason | Points blocked by anti-gaming |
| `token_economy.points.held_total` | Counter | ventureId | Points held for review |
| `token_economy.balance.current` | Gauge | ventureId, tier | Current balance by tier |
| `token_economy.claims.total` | Counter | ventureId, status | Claims by status |
| `token_economy.claims.latency_ms` | Histogram | ventureId | Claim processing latency |
| `token_economy.distribution.batch_size` | Histogram | ventureId | Recipients per batch |
| `token_economy.distribution.latency_ms` | Histogram | ventureId | Batch execution latency |
| `token_economy.conversion.total` | Counter | ventureId, regime | Conversions by regime |
| `token_economy.conversion.tokens` | Counter | ventureId | Total tokens converted |
| `token_economy.pool.remaining_pct` | Gauge | poolId | Pool budget remaining % |
| `token_economy.abuse.flags_total` | Counter | ventureId, severity | Abuse flags by severity |

#### ACS Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `token_economy.acs.health_score` | Gauge | economyId, dimension | Health scores (overall, liquidity, etc.) |
| `token_economy.acs.regime` | Gauge | economyId | Current regime (encoded as int) |
| `token_economy.acs.evaluation_duration_ms` | Histogram | economyId | Evaluation cycle duration |
| `token_economy.acs.adjustments_total` | Counter | economyId, controller | Controller adjustments |
| `token_economy.acs.regime_changes_total` | Counter | economyId | Regime transitions |
| `token_economy.acs.contribution_score` | Histogram | ventureId, category | Contribution scores |
| `token_economy.acs.leaderboard_compute_ms` | Histogram | ventureId | Leaderboard computation time |

#### Launchpad Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `token_economy.launch.raised_total` | Counter | saleId | Total raised per sale |
| `token_economy.launch.participants_total` | Counter | saleId | Total participants |
| `token_economy.launch.purchase_latency_ms` | Histogram | saleId | Purchase processing latency |
| `token_economy.launch.claims_total` | Counter | saleId | Vesting claims processed |
| `token_economy.launch.whitelist_verifications` | Counter | saleId, result | Whitelist verification results |

### Logging

Structured JSON logging with correlation IDs:

```json
{
  "level": "info",
  "module": "token-economy.rewards",
  "action": "points.accrued",
  "correlationId": "req_abc123",
  "userId": "user_xyz",
  "ventureId": "betedge",
  "source": "bet_placed",
  "amount": 100,
  "finalAmount": 125,
  "tierMultiplier": 1.25,
  "antiGamingScore": 0.05,
  "antiGamingAction": "allow",
  "durationMs": 42,
  "timestamp": "2026-02-09T04:44:00.000Z"
}
```

**Log levels:**
- `debug`: Formula evaluations, cache hits/misses, decay calculations
- `info`: Successful operations, evaluation completions, claim confirmations
- `warn`: Abuse flags, pool depletion warnings, override activations, regime changes
- `error`: Transaction failures, evaluation errors, circuit breaker opens

### Health Checks

```typescript
// Endpoint: /api/health/token-economy
{
  "status": "healthy",
  "modules": {
    "rewards": {
      "status": "healthy",
      "lastAccrual": "2026-02-09T04:43:55Z",
      "queueDepth": 42,
      "activeFlags": 3
    },
    "acs": {
      "status": "healthy",
      "regime": "growth",
      "lastEvaluation": "2026-02-09T04:30:00Z",
      "nextEvaluation": "2026-02-09T04:45:00Z",
      "overallHealth": 0.62
    },
    "launchpad": {
      "status": "healthy",
      "activeSales": 2,
      "pendingClaims": 15
    }
  },
  "dependencies": {
    "postgresql": "healthy",
    "redis": "healthy",
    "solana_rpc": "healthy",
    "redpanda": "healthy"
  }
}
```

### Alerting Rules

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| ACS Emergency Regime | regime = 'emergency' | P1 | Page on-call; review market conditions |
| Pool Budget < 10% | remainingAmount / totalBudget < 0.10 | P2 | Notify treasury team |
| Pool Depleted | status = 'depleted' | P1 | Halt dependent distributions |
| High Abuse Rate | abuse_flags/accruals > 5% in 1h | P2 | Review anti-gaming thresholds |
| Distribution Failures > 10% | failedCount/recipientCount > 0.10 | P1 | Check Solana RPC; pause batches |
| Claim Retry Exhausted | retryCount >= maxRetries | P2 | Manual intervention required |
| ACS Evaluation Timeout | duration > 30s | P3 | Check metrics providers |
| Redis Disconnected | connection lost | P1 | Fallback to PostgreSQL reads |
| Leaderboard Stale > 1h | lastComputedAt > 1 hour ago | P3 | Check cron job health |

---

## Security

### Threat Model

| Threat | Severity | Mitigation |
|--------|----------|------------|
| **Point farming / Sybil attacks** | Critical | 8-check anti-gaming engine on every accrual; device fingerprinting; IP reputation; cross-account correlation |
| **Referral abuse rings** | High | Referral chain analysis; circular chain detection; velocity anomaly detection |
| **Bot-driven accrual** | High | User agent analysis; request timing patterns; mouse entropy (client-side); rate limiting |
| **Unauthorized token distribution** | Critical | Distribution batches > $10K require explicit admin approval; treasury signing keys in Vault |
| **Manipulation of ACS parameters** | Critical | Override safety: mandatory expiry (max 7 days); full audit trail; governance approval for regime force |
| **Whitelist bypass** | High | Merkle proof verification on-chain; proofs generated server-side from verified whitelist |
| **KYC evasion** | High | KYC verified at claim time and purchase time; jurisdiction exclusion enforced at API layer |
| **Treasury key compromise** | Critical | Keys stored in Vault (never in env vars); multi-sig for high-value operations; signing ceremony for batch approval |
| **Conversion rate manipulation** | High | ACS bounds enforcement; dampening prevents sudden changes; 10% max change per cycle |
| **Front-running launchpad purchases** | Medium | Fair launch mechanism; Dutch auction (all pay clearing price); time-locked commit-reveal for lottery |

### Security Invariants

1. **Append-only point ledger**: The `reward_point_entries` table MUST NOT have UPDATE or DELETE operations. RLS policies enforce this. Database triggers reject any non-INSERT DML.

2. **Anti-gaming on every accrual**: There is no code path that bypasses the anti-gaming engine. Even `manual_adjustment` entries (admin corrections) run through the engine (though with relaxed thresholds).

3. **Distribution approval threshold**: Any distribution batch with total value > $10,000 equivalent MUST be explicitly approved by a super-admin before execution. This is enforced at the service layer, not just the API.

4. **ACS override expiry**: All manual overrides have mandatory expiry (maximum 168 hours). The system automatically clears expired overrides on every evaluation cycle.

5. **Merkle proof verification**: Whitelist purchases MUST include a valid Merkle proof. The proof is verified against the stored root hash before any purchase transaction is submitted.

6. **KYC enforcement**: Conversion (points→tokens) and launchpad purchases require KYC verification. The `@mcv/identity` package is queried at the time of the operation — not cached.

7. **Controller bounds**: ACS controllers have hard min/max bounds. No evaluation, override, or governance action can set a value outside these bounds. This prevents economic attacks via parameter manipulation.

### Row-Level Security (RLS)

All tables implement Supabase RLS:

```sql
-- Users can only see their own point entries
CREATE POLICY "users_own_points" ON reward_point_entries
  FOR SELECT USING (user_id = auth.uid());

-- Users can only see their own balances
CREATE POLICY "users_own_balance" ON reward_point_balances
  FOR SELECT USING (user_id = auth.uid());

-- Users can only see their own claims
CREATE POLICY "users_own_claims" ON reward_claims
  FOR SELECT USING (user_id = auth.uid());

-- Users can only see their own allocations
CREATE POLICY "users_own_allocations" ON launchpad_allocation
  FOR SELECT USING (user_id = auth.uid());

-- Admins can see all data for their venture
CREATE POLICY "admin_venture_access" ON reward_point_entries
  FOR ALL USING (
    venture_id IN (
      SELECT venture_id FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Super-admins can see all data globally
CREATE POLICY "super_admin_global" ON reward_point_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Point entries are INSERT-only (no UPDATE/DELETE for any role)
CREATE POLICY "points_insert_only" ON reward_point_entries
  FOR INSERT WITH CHECK (true);
-- No UPDATE or DELETE policies exist → effectively immutable
```

### Rate Limiting

```
Per-Source Rate Limits (Redis sliding window):
  ┌─────────────────────────┬─────────┬──────────────┬────────────┐
  │ Source                   │ Count   │ Window       │ Cooldown   │
  ├─────────────────────────┼─────────┼──────────────┼────────────┤
  │ bet_placed               │ 100     │ 60s          │ 0          │
  │ bet_won                  │ 100     │ 60s          │ 0          │
  │ referral_signup          │ 10      │ 24h          │ 1h         │
  │ referral_deposit         │ 10      │ 24h          │ 1h         │
  │ daily_login              │ 1       │ 24h          │ 0          │
  │ social_share             │ 5       │ 1h           │ 5min       │
  │ content_created          │ 20      │ 24h          │ 1min       │
  │ quest_completed          │ 50      │ 24h          │ 0          │
  │ governance_vote          │ 10      │ 24h          │ 0          │
  │ staking_deposit          │ 5       │ 1h           │ 0          │
  │ liquidity_provided       │ 5       │ 1h           │ 0          │
  │ marketplace_trade        │ 50      │ 1h           │ 0          │
  │ feedback_given           │ 10      │ 24h          │ 5min       │
  │ promotional              │ 1       │ 24h          │ 0          │
  │ manual_adjustment        │ 100     │ 1h           │ 0          │
  └─────────────────────────┴─────────┴──────────────┴────────────┘

API-Level Rate Limits:
  ├── Authenticated: 1000 req/min per user
  ├── Admin endpoints: 100 req/min per admin
  ├── Public (leaderboard, sale info): 300 req/min per IP
  └── Conversion endpoint: 10 req/hour per user
```

### Security Checklist

- [ ] Point ledger is append-only (no UPDATE/DELETE on `reward_point_entries`)
- [ ] Anti-gaming engine runs on every point accrual
- [ ] Distribution batches > $10K require explicit approval
- [ ] Merkle proofs verified before whitelist purchases
- [ ] Vesting claims require wallet signature verification
- [ ] KYC verification enforced for conversion and launchpad
- [ ] All controller overrides have mandatory expiry (max 7 days)
- [ ] ACS evaluation audit trail captures all adjustments
- [ ] Contribution scoring transparency logs accessible to users
- [ ] Rate limiting on all write operations
- [ ] Cross-venture reward rules validated for circular dependency
- [ ] Sybil detection running on referral chains
- [ ] IP reputation checks on all point accruals
- [ ] Device fingerprinting for multi-account detection
- [ ] Treasury wallet keys stored in Vault (never in env vars)
- [ ] RLS policies enforce user-level data isolation
- [ ] Circuit breakers on all external dependencies
- [ ] Structured logging with correlation IDs (no PII in logs)

---

*@mcv/token-economy — Token Economy Domain*
