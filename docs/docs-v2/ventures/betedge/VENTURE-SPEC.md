# BetEdge AI — Venture Specification

**Venture ID:** `betedge`
**Domain:** `betedge.app`
**Status:** Active (Migration from Prototype)
**Parent Entity:** BetEdge Inc. (subsidiary of EdgeIQ Holdings)
**Last Updated:** March 10, 2026

---

## 1. Venture Overview

BetEdge AI is a professional sports betting intelligence platform that combines real-time odds aggregation, machine learning predictions, arbitrage detection, and social pick-trading into a unified experience. It is the flagship consumer venture in the EdgeIQ Holdings portfolio and the primary driver of EDGE token utility.

### Value Proposition

BetEdge transforms recreational bettors into informed decision-makers through AI-powered analytics while providing professional handicappers with a monetization platform for their expertise. The platform does not accept wagers directly — it provides intelligence, predictions, and community features that integrate with licensed sportsbooks.

### Revenue Model

| Stream | Description | Target |
|--------|-------------|--------|
| Subscriptions | Tiered plans (Free, Pro $29/mo, Elite $99/mo, Whale $249/mo) | Primary |
| Marketplace Commission | 15% of vendor pick sales | Secondary |
| Affiliate Revenue Share | Sportsbook referral commissions (CPA + Rev Share) | Secondary |
| EDGE Token Economy | Token staking yields, premium feature gating | Tertiary |
| Data Licensing | Anonymized odds movement / prediction data B2B | Future |

### Target Users

| Segment | Description | Tier |
|---------|-------------|------|
| Recreational Bettor | Casual, 1-5 bets/week, needs simple guidance | Free / Pro |
| Serious Bettor | 10-30 bets/week, tracks CLV, wants advanced analytics | Pro / Elite |
| Professional Handicapper | Sells picks, manages subscribers, needs verification | Elite / Whale |
| Affiliate Partner | Promotes BetEdge, earns commissions on referrals | Affiliate Program |
| Data Consumer (B2B) | Wants odds data and prediction feeds | API Access |

---

## 2. MCV One Platform Module Consumption

BetEdge consumes shared MCV One platform modules (T0–T4) and domain modules (T5) rather than building standalone services. This section maps every BetEdge feature area to the platform modules it uses, plus the custom configuration or extension required.

### 2.1 Module Consumption Matrix

| BetEdge Feature Area | T5 Module(s) Consumed | Custom Configuration |
|----------------------|----------------------|---------------------|
| User Authentication | `@mcv/auth` (T1) | Sportsbook OAuth linking, age verification gate |
| User Profiles & Preferences | `@mcv/crm/contacts`, `@mcv/crm/profiles` | Sports preference fields, bankroll tracking fields |
| Subscription Billing | `@mcv/commerce/subscriptions`, `@mcv/commerce/billing` | 4-tier plan config (Free/Pro/Elite/Whale) |
| Picks Marketplace | `@mcv/commerce/products`, `@mcv/commerce/orders` | Pick-as-product model, vendor commission logic |
| Gamification & Engagement | `@mcv/engagement` (all 9 submodules) | Betting-specific achievements, streak types, leaderboard categories |
| Analytics Dashboards | `@mcv/analytics/dashboards`, `@mcv/analytics/reports` | Betting ROI, CLV tracking, win rate dashboards |
| Notifications & Alerts | `@mcv/nexus/notifications`, `@mcv/nexus/alerts` | Odds movement alerts, pick notifications, arbitrage alerts |
| Content & Blog | `@mcv/growth/content`, `@mcv/growth/seo` | Sports analysis articles, AI-generated previews |
| Affiliate Program | `@mcv/growth/affiliates`, `@mcv/growth/referrals` | 4-tier affiliate structure (Bronze/Silver/Gold/Platinum) |
| Social Features | `@mcv/engagement/leaderboards`, `@mcv/crm/contacts` | Follow system, bet sharing, social feed |
| EDGE Token Integration | `@mcv/token-economy`, `@mcv/web3-public` | Staking for premium features, pick escrow, governance voting |
| Compliance & RG | `@mcv/compliance/responsible-gaming`, `@mcv/compliance/kyc`, `@mcv/compliance/jurisdictions` | Deposit/loss/time limits, self-exclusion, GAMSTOP, jurisdiction gating |
| Customer Support | `@mcv/operations/support`, `@mcv/nexus/chat` | Betting-specific support categories, dispute resolution |
| AI Predictions | `@mcv/agentic-os` (Neural Hive-Mind) | Sports-optimized prompts, prediction pipeline |
| Data Pipeline | `@mcv/analytics/events`, `@mcv/cdp` | Odds events, prediction events, user behavior tracking |

### 2.2 Modules NOT Consumed by BetEdge

These platform modules are available but not relevant to BetEdge's domain:

- `@mcv/people` (HR/Team) — internal MCV management only
- `@mcv/portfolio` — holding company operations only
- `@mcv/treasury` — EdgeIQ-level financial management
- `@mcv/web3-core` — internal token operations (BetEdge uses `web3-public`)

---

## 3. BetEdge-Specific Domain Extensions

While BetEdge consumes shared platform modules, several features require custom domain logic that does not generalize to other ventures. These are implemented as **venture extensions** — packages scoped to `@betedge/*` that integrate with the platform's T5 modules via the extension point system.

### 3.1 Extension Package Registry

| Package | Purpose | Extends |
|---------|---------|---------|
| `@betedge/odds-engine` | Real-time odds aggregation, normalization, and comparison | `@mcv/analytics/events` |
| `@betedge/predictions` | ML prediction pipeline (model serving, ensembling, backtesting) | `@mcv/agentic-os` |
| `@betedge/arbitrage` | Cross-sportsbook arbitrage detection and alerting | `@mcv/analytics/dashboards` |
| `@betedge/picks-engine` | AI pick generation, vendor pick validation, performance tracking | `@mcv/commerce/products` |
| `@betedge/sportsbook-connector` | Sportsbook API integrations (The Odds API, SportsDataIO, OddsJam) | `@mcv/nexus/integrations` |
| `@betedge/sports-data` | Sports statistics, injuries, weather, team/player data | `@mcv/analytics/events` |
| `@betedge/bankroll` | Bankroll management, Kelly criterion, unit sizing | `@mcv/finance/accounting` |
| `@betedge/verification` | On-chain pick verification via Solana program | `@mcv/web3-public` |

### 3.2 @betedge/odds-engine

**Purpose:** Aggregates odds from 20+ sportsbooks, normalizes to a common format, tracks line movements, and detects steam/sharp money indicators.

**Data Flow:**
```
Sportsbook APIs → odds-ingestion (cron) → Redpanda topic: mcv.betedge.odds.updated
    → odds-engine (consumer) → Normalized odds in PostgreSQL + Redis cache
        → WebSocket: /ws/odds (real-time push to clients)
        → arbitrage-engine (detects cross-book opportunities)
        → predictions-engine (feature input for ML models)
```

**Key Tables (migrated from prototype):**

| Prototype Table (SQLAlchemy) | MCV One Table (Drizzle) | Notes |
|------------------------------|------------------------|-------|
| `odds_feeds` | `betedge_odds_feeds` | Venture-scoped, add `venture_id` |
| `odds_history` | `betedge_odds_history` | TimescaleDB hypertable → standard partitioning |
| `sportsbooks` | `betedge_sportsbooks` | Reference table, pre-seeded |
| `sportsbook_connections` | `betedge_sportsbook_connections` | User's linked sportsbook accounts |
| `steam_events` | `betedge_steam_events` | Sharp money indicators |

**Configuration (venture_settings):**
```typescript
{
  ventureId: 'betedge-uuid',
  extensions: {
    'odds-engine': {
      providers: ['the-odds-api', 'sportsdataio', 'oddsjam'],
      refreshIntervalMs: 30000,      // 30s default, 5s for live games
      sportsbooks: ['draftkings', 'fanduel', 'betmgm', 'caesars', ...],
      sports: ['nfl', 'nba', 'mlb', 'nhl', 'ncaaf', 'ncaab', 'soccer', 'mma', 'tennis'],
      lineMovementThreshold: 0.5,    // points shift to trigger alert
      steamDetection: {
        volumeThreshold: 3,          // simultaneous books moving same direction
        timeWindowMs: 120000,         // within 2 minutes
      }
    }
  }
}
```

### 3.3 @betedge/predictions

**Purpose:** Multi-model ensemble prediction system for game outcomes, player props, and market movements.

**Model Pipeline:**
```
Historical Data + Live Features
    → Feature Engineering (stats, weather, injuries, odds, social sentiment)
        → Model Ensemble:
            ├── XGBoost (structured data — win probability)
            ├── LSTM (time series — line movement prediction)
            ├── Transformer (NLP — injury/news impact scoring)
            └── LLM Agent (Claude via @mcv/gateway — qualitative analysis)
        → Ensemble Aggregator (weighted average with confidence intervals)
            → Prediction Output (probability, edge, recommended stake)
```

**Migration from Python Prototype:**

The prototype uses FastAPI + TensorFlow/PyTorch for ML serving. The migration strategy is:

1. **Keep Python ML models** — ML serving stays in Python (deployed as sidecar or separate K8s pod)
2. **Wrap with tRPC bridge** — `@betedge/predictions` calls Python service via HTTP, exposes tRPC interface
3. **Feature engineering in TypeScript** — data preparation logic migrates to Drizzle queries
4. **Model registry** — track model versions, A/B test configurations, performance metrics

**Key Tables:**

| Prototype Table | MCV One Table | Notes |
|----------------|---------------|-------|
| `ml_models` | `betedge_ml_models` | Model metadata, version, accuracy metrics |
| `prediction_logs` | `betedge_prediction_logs` | Every prediction with features and outcome |
| `model_performance_metrics` | `betedge_model_performance` | Rolling accuracy, ROI, calibration |
| `signal_predictions` | `betedge_signal_predictions` | Real-time signal outputs |
| `ab_test_experiments` | `betedge_ab_tests` | Model A/B testing |

### 3.4 @betedge/arbitrage

**Purpose:** Detects guaranteed-profit arbitrage opportunities across sportsbooks in real-time.

**Algorithm:**
```
For each event, for each market:
  1. Collect best odds from all sportsbooks for all outcomes
  2. Calculate implied probability sum
  3. If sum < 1.0 → arbitrage exists
  4. Calculate optimal stake distribution (Kelly variant)
  5. Factor in: max bet limits, odds freshness, execution time
  6. Score by: profit %, confidence, book reliability
  7. Alert user via WebSocket + push notification
```

**Production Readiness:** The arbitrage engine in the prototype is marked as production-ready. Migration involves wrapping the existing Python logic in a tRPC-accessible service.

### 3.5 @betedge/picks-engine

**Purpose:** Manages the picks marketplace where professional handicappers sell verified picks to subscribers.

**Lifecycle:**
```
Vendor submits pick → Validation (odds check, time check, dedup)
    → Escrow USDC via Solana program → Pick published to marketplace
        → Subscribers receive notification → Game plays out
            → Oracle verifies result → Win/Loss recorded
                → Win: Vendor earns commission + stats updated
                → Loss: USDC refund distributed to subscribers (pro-rata)
```

**On-Chain Verification (Solana Program):**
- Program ID: `Bet1111111111111111111111111111111111111111`
- Instructions: `initialize_vendor`, `submit_pick`, `verify_result`, `process_refund`, `update_vendor_stats`
- Accounts: `PickAccount`, `EscrowAccount`, `VendorAccount`
- Token: USDC-SPL (escrow currency)

**Vendor Tiers:**

| Tier | Win Rate Req | Min Picks | Commission | Features |
|------|-------------|-----------|------------|----------|
| Unverified | None | 0 | 10% | Basic listing |
| Bronze | 52%+ | 50 | 12% | Featured placement |
| Silver | 55%+ | 200 | 15% | Priority alerts, analytics |
| Gold | 58%+ | 500 | 18% | Custom branding, API access |
| Platinum | 60%+ | 1000 | 20% | Revenue share, promotion |

### 3.6 @betedge/sportsbook-connector

**Purpose:** Abstracts external sports data provider APIs into a unified internal interface.

**Providers:**

| Provider | Data Type | Update Frequency | Priority |
|----------|-----------|-------------------|----------|
| The Odds API | Live odds, lines | 30s | Primary |
| SportsDataIO | Stats, scores, injuries, schedules | 1 min | Primary |
| OddsJam | Odds intelligence, positive EV | 30s | Secondary |
| Sports Insights | Sharp money, public % | 5 min | Secondary |
| OpenWeatherMap | Weather for outdoor events | 1 hour | Tertiary |

### 3.7 @betedge/bankroll

**Purpose:** Helps users manage their betting bankroll with mathematical staking strategies.

**Features:**
- Bankroll tracking with multi-sportsbook balance aggregation
- Kelly Criterion calculator (full Kelly, half Kelly, quarter Kelly)
- Unit-based staking system (configurable unit size)
- Session tracking (daily, weekly, monthly P&L)
- Drawdown alerts and stop-loss triggers
- ROI and CLV (Closing Line Value) analytics

---

## 4. Database Migration Strategy

### 4.1 Prototype → MCV One Table Mapping

The BetEdge prototype has 187 tables across SQLAlchemy (Python) and Prisma (TypeScript). The migration to MCV One's Drizzle ORM follows this strategy:

**Category A — Absorbed by Platform (no custom tables needed):**

| Prototype Model | MCV One Module | Notes |
|----------------|----------------|-------|
| `User`, `Session`, `Account` | `@mcv/auth` (T1) | Better Auth replaces Auth0 + custom JWT |
| `Notification`, `NotificationPreferences` | `@mcv/nexus/notifications` | Direct mapping |
| `Achievement`, `Quest`, `Leaderboard`, `Season` | `@mcv/engagement` | Near-identical, add venture config |
| `Follow`, `BetShare`, `BetLike`, `BetComment` | `@mcv/engagement`, `@mcv/crm` | Social features platform-native |
| `AffiliateProfile`, `ReferralCode` | `@mcv/growth/affiliates` | Absorb 4-tier structure into platform |
| `Pricing`, `PriceBundle`, `SubscriptionTier` | `@mcv/commerce/subscriptions` | Standard subscription modeling |
| `Support`, `Newsletter` | `@mcv/operations/support`, `@mcv/growth/content` | Standard platform features |
| `RGLimit`, `RGIntervention`, `SelfExclusion` | `@mcv/compliance/responsible-gaming` | Already platform-native |

**Category B — BetEdge-Specific (custom Drizzle tables with `venture_id`):**

| Prototype Model | MCV One Table | Package |
|----------------|---------------|---------|
| `Bet`, `BetVerification`, `Parlay` | `betedge_bets`, `betedge_bet_verifications`, `betedge_parlays` | `@betedge/predictions` |
| `OddsFeed`, `OddsHistory` | `betedge_odds_feeds`, `betedge_odds_history` | `@betedge/odds-engine` |
| `VendorPick`, `MarketplacePick`, `Vendor` | `betedge_vendor_picks`, `betedge_marketplace_picks`, `betedge_vendors` | `@betedge/picks-engine` |
| `MLModel`, `PredictionLog` | `betedge_ml_models`, `betedge_prediction_logs` | `@betedge/predictions` |
| `Bankroll`, `BankrollTransaction` | `betedge_bankrolls`, `betedge_bankroll_transactions` | `@betedge/bankroll` |
| `Team`, `Game`, `TeamStats`, `PlayerStats`, `Injury` | `betedge_teams`, `betedge_games`, `betedge_team_stats`, `betedge_player_stats`, `betedge_injuries` | `@betedge/sports-data` |
| `Sportsbook`, `SportsbookConnection` | `betedge_sportsbooks`, `betedge_sportsbook_connections` | `@betedge/sportsbook-connector` |
| `CLVTracking`, `SteamEvent` | `betedge_clv_tracking`, `betedge_steam_events` | `@betedge/odds-engine` |
| `Wallet`, `SwapTransaction` | Platform `wallets` table via `@mcv/web3-public` | Uses platform, no custom table |

**Category C — Deprecated (not migrated):**

| Prototype Model | Reason |
|----------------|--------|
| `APIKey` (custom auth) | Replaced by Better Auth API key module |
| `DemandMetric` (old pricing) | Replaced by platform analytics |
| Various _v2 / _legacy tables | Prototype iteration artifacts |

### 4.2 Migration Sequence

The migration follows a phased approach aligned with the strategic roadmap:

1. **M0 (Foundation):** Platform tables only — auth, CRM, basic settings
2. **M1 (Core Features):** Odds engine tables, sports data tables, basic predictions
3. **M2 (Marketplace):** Picks engine tables, vendor tables, escrow integration
4. **M3 (Scale):** Full analytics tables, ML model registry, arbitrage engine
5. **M4 (Token):** EDGE token integration tables, staking, governance

---

## 5. EDGE Token Integration

BetEdge is the primary utility driver for the EDGE token (shared with EdgeIQ Markets). Token integration touches multiple platform modules.

### 5.1 Token Utility Within BetEdge

| Utility | Description | Token Flow |
|---------|-------------|------------|
| Premium Feature Gating | Stake EDGE to unlock Elite/Whale tier features without subscription | User → Staking Program |
| Pick Escrow | Vendors stake EDGE as quality guarantee on premium picks | Vendor → Escrow Program |
| Governance Voting | Token-weighted voting on platform features, vendor disputes | User → Governance Program |
| Tipping | Tip handicappers for free picks | User → Vendor Wallet |
| Achievement Minting | Rare achievements mint as NFTs on Solana | Platform → User Wallet |
| Marketplace Fee Discount | Pay marketplace fees in EDGE for 20% discount | User → Treasury |

### 5.2 Solana Program Suite

| Program | Purpose | Status |
|---------|---------|--------|
| EDGE Token (SPL Token-2022) | Token mint with transfer hooks for compliance | Defined in ADR-008 |
| Staking Program | Time-weighted staking for premium access and yield | Spec needed |
| Pick Verification Program | On-chain pick submission, escrow, result verification | Prototype complete |
| Governance Program | EDGE-weighted proposal and voting | Spec needed |
| Marketplace Escrow | USDC/EDGE escrow for pick transactions | Prototype partial |

### 5.3 Fiat On-Ramp / Off-Ramp

For non-crypto users (Tier 4 wallet — "Observer" per ADR-008):

```
User (no wallet) → Stripe payment → Platform treasury → EDGE allocated internally
    → User earns equivalent benefits without touching crypto
    → Optional: User creates wallet later → Internal EDGE transferred to on-chain wallet
```

---

## 6. API Architecture (tRPC Routers)

BetEdge's API surface is exposed through tRPC routers that compose platform routers with venture-specific extensions.

### 6.1 Router Registry

```typescript
// apps/super-admin/server/routers/betedge.ts
export const betedgeRouter = router({
  // Venture-specific routers
  odds: betedgeOddsRouter,           // @betedge/odds-engine
  predictions: betedgePredictionsRouter, // @betedge/predictions
  arbitrage: betedgeArbitrageRouter,     // @betedge/arbitrage
  picks: betedgePicksRouter,            // @betedge/picks-engine
  sportsData: betedgeSportsDataRouter,   // @betedge/sports-data
  bankroll: betedgeBankrollRouter,       // @betedge/bankroll
  verification: betedgeVerificationRouter, // @betedge/verification

  // Platform routers consumed with BetEdge config
  // (These come from @mcv/* packages, no custom code needed)
});
```

### 6.2 WebSocket Channels

Migrated from the prototype's 7 WebSocket channels to Redpanda-backed real-time subscriptions:

| Prototype Channel | MCV One Topic | Consumer |
|-------------------|--------------|----------|
| `/ws/odds` | `mcv.betedge.odds.updated` | tRPC subscription |
| `/ws/steam` | `mcv.betedge.odds.steam-detected` | tRPC subscription |
| `/ws/predictions` | `mcv.betedge.predictions.generated` | tRPC subscription |
| `/ws/picks` | `mcv.betedge.picks.published` | tRPC subscription |
| `/ws/arbitrage` | `mcv.betedge.arbitrage.opportunity` | tRPC subscription |
| `/ws/alerts` | `mcv.betedge.alerts.*` | tRPC subscription |
| `/ws/admin/dashboard` | `mcv.betedge.admin.metrics` | tRPC subscription |

---

## 7. Migration Path: Prototype → MCV One

### 7.1 Migration Strategy

The BetEdge prototype is a production-ready Python/FastAPI system. Migration to MCV One is not a rewrite — it is a **progressive integration** that preserves working logic while gaining platform benefits.

**Principle: Strangle Fig Pattern**

```
Phase 1: BetEdge prototype runs alongside MCV One
Phase 2: Shared features (auth, CRM, engagement) migrate to platform
Phase 3: Domain logic (odds, predictions) wraps Python services
Phase 4: Python services gradually rewritten in TypeScript (optional)
Phase 5: Prototype decommissioned
```

### 7.2 Phase-by-Phase Migration

**Phase 1 — Coexistence (M0–M1)**
- MCV One platform deployed with BetEdge as a venture
- BetEdge prototype continues serving users
- Shared session: Better Auth issues JWTs accepted by both systems
- Database: BetEdge prototype reads from its own DB; new platform tables in MCV One DB
- Event bridge: Prototype publishes to Redpanda topics; MCV One consumes

**Phase 2 — Feature Migration (M1–M2)**
- Authentication: Migrate to Better Auth (platform)
- User profiles: Migrate to @mcv/crm
- Notifications: Migrate to @mcv/nexus
- Gamification: Migrate to @mcv/engagement (achievements, quests, leaderboards)
- Subscriptions: Migrate to @mcv/commerce
- Affiliates: Migrate to @mcv/growth/affiliates

**Phase 3 — Domain Wrapping (M2–M3)**
- Odds engine: Python service stays, wrapped by `@betedge/odds-engine` tRPC router
- Predictions: Python ML models stay, wrapped by `@betedge/predictions`
- Arbitrage: Python engine stays, wrapped by `@betedge/arbitrage`
- Picks marketplace: Rewrite in TypeScript (logic is straightforward)
- Sportsbook connector: Rewrite in TypeScript

**Phase 4 — Optional TypeScript Rewrite (M3+)**
- Odds aggregation: Rewrite if TypeScript performance is sufficient
- ML serving: Keep in Python (TensorFlow/PyTorch ecosystem)
- Stats processing: Rewrite for Drizzle query consistency
- Arbitrage: Evaluate based on performance requirements

### 7.3 Data Migration Runbook

```
Step 1: Schema creation
  - Run Drizzle migrations to create betedge_* tables in MCV One DB
  - Verify indexes, RLS policies, venture_id constraints

Step 2: Historical data ETL
  - Export from prototype PostgreSQL (pg_dump selective tables)
  - Transform: add venture_id, convert UUID formats, normalize enums
  - Load into MCV One tables (pg_restore or custom ETL script)
  - Verify: row counts, referential integrity, sample queries

Step 3: Dual-write period
  - Prototype writes to both old and new tables (via Redpanda events)
  - MCV One reads from new tables
  - Monitor for discrepancies (Scout agent)

Step 4: Cutover
  - Switch DNS: betedge.app → MCV One deployment
  - Prototype enters read-only mode
  - 48-hour monitoring window
  - Decommission prototype database
```

---

## 8. Venture-Specific Configuration

### 8.1 venture_settings Record

```typescript
{
  id: 'betedge-venture-uuid',
  slug: 'betedge',
  name: 'BetEdge AI',
  domain: 'betedge.app',
  status: 'active',
  
  branding: {
    logo: '/assets/betedge/logo.svg',
    favicon: '/assets/betedge/favicon.ico',
    primaryColor: '#1E40AF',       // Blue
    secondaryColor: '#10B981',     // Green (profit indicators)
    accentColor: '#F59E0B',        // Amber (alerts)
    fontFamily: 'Inter',
    tagline: 'AI-Powered Sports Intelligence',
  },

  features: {
    crm: true,
    analytics: true,
    engagement: true,
    commerce: true,
    compliance: true,
    web3: true,
    ai: true,
    marketing: true,
    support: true,
    // BetEdge-specific features
    oddsEngine: true,
    predictions: true,
    arbitrage: true,
    picksMarketplace: true,
    bankrollManagement: true,
    sportsData: true,
    responsibleGaming: true,
  },

  ai: {
    defaultChain: 'DEFAULT_CHAIN',
    monthlyBudget: 500,
    allowedModels: ['claude-*', 'gpt-4*', 'deepseek-*'],
    customSystemPrompt: `You are a sports analytics expert for BetEdge AI. 
      You specialize in statistical analysis, odds evaluation, value betting, 
      bankroll management, and sports prediction modeling. Always cite specific 
      statistics and historical data. Never guarantee outcomes. Include confidence 
      intervals with predictions. Promote responsible gambling practices.`,
  },

  compliance: {
    kycRequired: true,
    kycProvider: 'sumsub',
    ageVerification: true,
    minimumAge: 21,
    responsibleGaming: true,
    restrictedJurisdictions: ['US-WA', 'US-UT', 'US-HI', 'SG', 'TR', 'CN'],
    gamblingLicense: null,  // Information platform, not a gambling operator
    amlScreening: true,     // Required for EDGE token transactions
  },

  web3: {
    chain: 'solana',
    tokenMint: 'EDGE_TOKEN_MINT_ADDRESS',
    stakingProgram: 'STAKING_PROGRAM_ADDRESS',
    pickVerificationProgram: 'Bet1111111111111111111111111111111111111111',
    governanceProgram: 'GOVERNANCE_PROGRAM_ADDRESS',
    escrowMint: 'USDC_MINT_ADDRESS',
  },

  integrations: {
    sportsData: {
      theOddsApi: { apiKey: 'vault://betedge/the-odds-api-key' },
      sportsDataIo: { apiKey: 'vault://betedge/sportsdataio-key' },
      oddsJam: { apiKey: 'vault://betedge/oddsjam-key' },
    },
    payments: {
      stripe: { accountId: 'vault://betedge/stripe-account-id' },
    },
    analytics: {
      posthog: { projectId: 'vault://betedge/posthog-project-id' },
    },
  },
}
```

### 8.2 Venture Admin Module Enablement

When a venture admin logs into the BetEdge venture, the following module set is active:

| Module Group | Enabled Modules |
|-------------|----------------|
| Core Dashboard | Home, Analytics Overview, AI Assistant |
| CRM | Contacts, Segments, Tags |
| Engagement | Achievements, Quests, Leaderboards, Seasons, Streaks |
| Commerce | Subscriptions, Marketplace, Revenue Reports |
| Growth | Affiliates, Referrals, Content, SEO |
| Compliance | KYC Queue, RG Reports, Jurisdiction Manager |
| Support | Tickets, Knowledge Base, Live Chat |
| **BetEdge Custom** | Odds Dashboard, Prediction Monitor, Arbitrage Console, Vendor Management, Sports Data Health |

---

## 9. Infrastructure Requirements

### 9.1 Kubernetes Namespace

```yaml
# betedge-prod namespace
apiVersion: v1
kind: Namespace
metadata:
  name: betedge-prod
  labels:
    venture: betedge
    environment: production
```

### 9.2 Resource Allocation

| Component | CPU | Memory | Replicas | Notes |
|-----------|-----|--------|----------|-------|
| Odds Ingestion Worker | 0.5 vCPU | 512 MB | 2 | Cron-based, every 30s |
| ML Prediction Service (Python) | 2 vCPU | 4 GB | 2 | GPU optional for training |
| Arbitrage Engine | 1 vCPU | 1 GB | 2 | CPU-intensive calculations |
| WebSocket Server | 0.5 vCPU | 256 MB | 3 | Long-lived connections |
| Sports Data Ingestion | 0.5 vCPU | 512 MB | 1 | Scheduled batch jobs |

### 9.3 Data Storage

| Store | Purpose | Size Estimate (Year 1) |
|-------|---------|----------------------|
| PostgreSQL (MCV One DB) | All BetEdge tables | ~50 GB |
| Redis | Odds cache, session data, leaderboard sorted sets | ~2 GB |
| Redpanda | Event topics (7-day retention) | ~10 GB |
| S3 | ML model artifacts, historical data exports | ~100 GB |

---

## 10. Key Performance Indicators

### 10.1 Business KPIs

| KPI | Target (M3) | Target (M6) | Target (M12) |
|-----|-------------|-------------|--------------|
| Monthly Active Users | 1,000 | 5,000 | 25,000 |
| Paid Subscribers | 100 | 750 | 5,000 |
| MRR | $5,000 | $30,000 | $200,000 |
| Marketplace Vendors | 10 | 50 | 200 |
| Pick Volume (daily) | 50 | 500 | 5,000 |
| Affiliate Partners | 5 | 25 | 100 |
| EDGE Token Stakers | 50 | 500 | 5,000 |

### 10.2 Technical KPIs

| KPI | Target | Measurement |
|-----|--------|-------------|
| Odds Update Latency | < 2s end-to-end | Ingestion → client WebSocket |
| Prediction Generation | < 5s per game | Model ensemble pipeline |
| Arbitrage Detection | < 500ms | Odds update → alert |
| API Response (p95) | < 200ms | tRPC endpoints |
| Uptime | 99.9% | Monthly availability |
| Pick Verification | < 30s | Result → on-chain attestation |

---

## 11. Regulatory Considerations

### 11.1 Classification

BetEdge AI is an **information and analytics platform**, not a gambling operator. It does not accept wagers, hold customer funds (except EDGE tokens), or facilitate direct betting. This classification is important for regulatory compliance.

### 11.2 Compliance Requirements

| Requirement | Implementation | Module |
|-------------|---------------|--------|
| Age Verification | Required at signup (21+ in US) | `@mcv/compliance/kyc` |
| Responsible Gaming | Deposit/loss/time limits, self-exclusion | `@mcv/compliance/responsible-gaming` |
| Jurisdiction Gating | Disable features in restricted regions | `@mcv/compliance/jurisdictions` |
| AML Screening | Required for EDGE token transactions | `@mcv/compliance/aml` |
| Data Privacy | GDPR/CCPA compliant data handling | Platform-level |
| Affiliate Disclosure | Clear disclosure on all affiliate links | `@mcv/growth/affiliates` |
| Pick Disclaimer | "Past performance does not guarantee future results" | UI-level |

### 11.3 Restricted Jurisdictions

- **Full Block:** China, Singapore, Turkey, North Korea
- **Feature Restrictions:** Washington State (US), Utah (US), Hawaii (US) — no picks marketplace
- **Age Gating:** 21+ in all US states, 18+ internationally
- **Token Restrictions:** Follow SEC/FinCEN guidance on utility token classification

---

## 12. Mobile Applications

### 12.1 Migration Strategy

The prototype includes production-ready iOS (SwiftUI) and Android (Kotlin/Jetpack Compose) apps. The migration approach:

1. **Phase 1:** Update API endpoints to point to MCV One backend
2. **Phase 2:** Integrate Better Auth SDK (replacing Auth0)
3. **Phase 3:** Add MCV One push notification integration
4. **Phase 4:** White-label framework for venture branding
5. **Phase 5:** Feature parity with web portal

### 12.2 Mobile-Specific Features

| Feature | Priority | Notes |
|---------|----------|-------|
| Push Notifications (odds alerts) | P0 | Real-time odds movement, pick drops |
| Offline Mode (bankroll tracking) | P1 | Local-first with sync |
| Biometric Auth | P0 | Face ID / fingerprint |
| Live Score Widget | P1 | iOS widget, Android widget |
| Quick Bet Slip | P2 | Deep link to sportsbook apps |

---

## 13. Appendix

### 13.1 Event Topic Registry

All BetEdge Redpanda topics follow the convention: `mcv.betedge.{domain}.{action}`

| Topic | Payload | Frequency |
|-------|---------|-----------|
| `mcv.betedge.odds.updated` | Normalized odds snapshot | ~1000/min during game hours |
| `mcv.betedge.odds.steam-detected` | Steam event with affected books | ~50/day |
| `mcv.betedge.predictions.generated` | Prediction with confidence interval | ~200/day |
| `mcv.betedge.picks.submitted` | Vendor pick with escrow details | ~100/day |
| `mcv.betedge.picks.verified` | Pick result + on-chain attestation | ~100/day |
| `mcv.betedge.arbitrage.opportunity` | Arb details + optimal stakes | ~20/day |
| `mcv.betedge.user.bet-logged` | User's manual bet entry | ~500/day |
| `mcv.betedge.user.bankroll-updated` | Bankroll balance change | ~500/day |
| `mcv.betedge.compliance.rg-limit-hit` | Responsible gaming limit triggered | ~10/day |

### 13.2 Third-Party API Cost Estimates

| Provider | Plan | Monthly Cost | Rate Limit |
|----------|------|-------------|------------|
| The Odds API | Professional | $200/mo | 10,000 requests/mo |
| SportsDataIO | Professional | $300/mo | 50,000 requests/mo |
| OddsJam | Standard | $150/mo | Unlimited |
| Sports Insights | Basic | $100/mo | 5,000 requests/mo |
| OpenWeatherMap | Free | $0 | 60 requests/min |
| **Total** | | **$750/mo** | |

### 13.3 Competitive Landscape

| Competitor | Differentiator | BetEdge Advantage |
|-----------|---------------|-------------------|
| Action Network | Media-focused, limited AI | Full AI prediction pipeline + verification |
| OddsJam | Positive EV + arbitrage | Broader (predictions + marketplace + social) |
| Pikkit | Social pick sharing | On-chain verification + EDGE token economy |
| BettorEdge | Portfolio tracking | ML predictions + arbitrage + marketplace |
| Unabated | Sharp bettor tools | More accessible UX + gamification |
