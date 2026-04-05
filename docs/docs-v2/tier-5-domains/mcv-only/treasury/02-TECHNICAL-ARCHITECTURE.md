# @mcv/treasury — Technical Architecture

> **Package:** `@mcv/treasury`
> **Classification:** MCV-ONLY
> **Tier:** 5 — Domain Layer
> **Version:** 1.0.0
> **Last Updated:** February 9, 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Diagram](#system-diagram)
3. [Module Architecture](#module-architecture)
4. [Data Models & Schema](#data-models--schema)
5. [Data Flow & Events](#data-flow--events)
6. [Integration Points](#integration-points)
7. [Performance Architecture](#performance-architecture)
8. [Scalability](#scalability)
9. [Error Handling](#error-handling)
10. [Observability](#observability)
11. [Security Architecture](#security-architecture)

---

## Architecture Overview

`@mcv/treasury` implements a **domain-driven design** with four bounded contexts — Cash, Funding, P&L, and Tax — each with dedicated schemas, services, and event streams. These four submodules share a common database (PostgreSQL via Supabase) but maintain logical separation through table prefixes, service boundaries, and independent event topics.

### Design Principles

1. **Consortium-Level Aggregation**: Treasury operates across all 9 MCV ventures simultaneously, breaking the typical single-tenant pattern. Services must aggregate venture-level data while maintaining per-venture isolation for RLS.

2. **Financial Precision**: All monetary values use `numeric(19, 4)` (19 digits, 4 decimal places) via Drizzle ORM. Application-layer calculations use `decimal.js` to avoid floating-point errors. No `float` or `double` types anywhere in treasury.

3. **Immutability for Auditing**: Financial records are append-only. Updates create new versions rather than modifying existing rows. Deletions are soft-deletes with audit trail entries. Period closings lock records from further modification.

4. **Event-Driven Integration**: Treasury publishes events to Redpanda/Kafka topics for downstream consumers. The CFO Agent, Tax Agent, and portfolio views all subscribe to treasury events rather than polling.

5. **Dual-Path Data Access**: Venture-scoped access (via RLS) for per-venture views, and service-role elevated access for consolidation operations that span all ventures.

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Database** | PostgreSQL 15 (Supabase) | Primary data store, 62 tables |
| **ORM** | Drizzle ORM ^0.35.x | Type-safe schema and queries |
| **Validation** | Zod ^3.x | Runtime input validation |
| **Events** | Redpanda/Kafka | Event publishing and consumption |
| **Cache** | Redis (Upstash) | Position caching, rate limiting |
| **Precision Math** | decimal.js ^10.x | Financial calculations |
| **Date Handling** | date-fns ^3.x | Tax calendars, period logic |
| **AI** | OpenRouter (GPT-4o, Claude) | Forecasting, narrative generation |
| **Bank Feeds** | Plaid ^20.x | Account balance sync |
| **Runtime** | Next.js 15 + Turborepo | Monorepo build and execution |

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          @mcv/treasury SYSTEM ARCHITECTURE                       │
│                                                                                 │
│  ╔═══════════════════════════════════════════════════════════════════════════╗   │
│  ║                          ENTRY POINTS                                    ║   │
│  ║                                                                          ║   │
│  ║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    ║   │
│  ║  │  API Routes   │ │  Cron Jobs   │ │  Webhooks    │ │  NAOS Agents │    ║   │
│  ║  │ /api/treasury │ │ 12 scheduled │ │ Bank feeds   │ │ CFO Agent    │    ║   │
│  ║  │ /api/funding  │ │ jobs via     │ │ Plaid/Stripe │ │ Tax Agent    │    ║   │
│  ║  │ /api/pnl      │ │ @mcv/fabric  │ │ ACH/Wire     │ │ IR Agent     │    ║   │
│  ║  │ /api/tax      │ │ cron engine  │ │ callbacks    │ │              │    ║   │
│  ║  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘    ║   │
│  ╚═════════╪════════════════╪════════════════╪════════════════╪═════════════╝   │
│            │                │                │                │                  │
│            └────────────────┴────────┬───────┴────────────────┘                  │
│                                      │                                           │
│  ╔═══════════════════════════════════╧═══════════════════════════════════════╗   │
│  ║                          AUTHENTICATION & AUTHORIZATION                   ║   │
│  ║                                                                           ║   │
│  ║  @mcv/identity → Role check → treasury:admin | treasury:viewer            ║   │
│  ║  Dual-approval middleware for high-value operations (>$25K)                ║   │
│  ║  Investor portal isolation (investor_id scoping)                           ║   │
│  ╚═══════════════════════════════════╤═══════════════════════════════════════╝   │
│                                      │                                           │
│  ╔═══════════════════════════════════╧═══════════════════════════════════════╗   │
│  ║                            SERVICE LAYER                                  ║   │
│  ║                                                                           ║   │
│  ║  ┌─────────────────────────┐  ┌─────────────────────────┐                ║   │
│  ║  │         CASH            │  │        FUNDING           │                ║   │
│  ║  │                         │  │                          │                ║   │
│  ║  │  CashService            │  │  FundingService          │                ║   │
│  ║  │  CashForecastService    │  │  CapTableService         │                ║   │
│  ║  │  SweepService           │  │  InvestorService         │                ║   │
│  ║  │  CashPoolingService     │  │  WaterfallService        │                ║   │
│  ║  │                         │  │                          │                ║   │
│  ║  │  14 tables              │  │  16 tables               │                ║   │
│  ║  │  6 cron jobs            │  │  2 cron jobs             │                ║   │
│  ║  └────────────┬────────────┘  └────────────┬─────────────┘                ║   │
│  ║               │                             │                              ║   │
│  ║  ┌────────────┴────────────┐  ┌────────────┴─────────────┐                ║   │
│  ║  │          PNL            │  │          TAX              │                ║   │
│  ║  │                         │  │                           │                ║   │
│  ║  │  PnlService             │  │  TaxService               │                ║   │
│  ║  │  EliminationService     │  │  TaxCalendarService       │                ║   │
│  ║  │  VarianceService        │  │  TransferPricingService   │                ║   │
│  ║  │  SegmentReportingService│  │  TaxCreditService         │                ║   │
│  ║  │  BoardReportService     │  │  TaxProvisionService      │                ║   │
│  ║  │                         │  │                           │                ║   │
│  ║  │  14 tables              │  │  18 tables                │                ║   │
│  ║  │  2 cron jobs            │  │  3 cron jobs              │                ║   │
│  ║  └────────────┬────────────┘  └────────────┬──────────────┘                ║   │
│  ╚═══════════════╪════════════════════════════╪═══════════════════════════════╝   │
│                  │                             │                                  │
│  ╔═══════════════╧═════════════╤═══════════════╧═══════════════════════════════╗  │
│  ║                  SHARED INFRASTRUCTURE                                      ║  │
│  ║                                                                             ║  │
│  ║  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   ║  │
│  ║  │  PostgreSQL   │  │   Redis      │  │  Redpanda    │  │  OpenRouter  │   ║  │
│  ║  │  (Supabase)   │  │  (Upstash)   │  │  (Events)    │  │  (AI)        │   ║  │
│  ║  │              │  │              │  │              │  │              │   ║  │
│  ║  │  62 tables   │  │  Position    │  │  Treasury    │  │  Forecasting │   ║  │
│  ║  │  RLS on all  │  │  cache       │  │  events      │  │  Narrative   │   ║  │
│  ║  │  Audit       │  │  Rate limit  │  │  topic per   │  │  generation  │   ║  │
│  ║  │  triggers    │  │  FX rates    │  │  submodule   │  │              │   ║  │
│  ║  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   ║  │
│  ╚═════════════════════════════════════════════════════════════════════════════╝  │
│                                                                                  │
│  ╔════════════════════════════════════════════════════════════════════════════╗   │
│  ║                     EXTERNAL INTEGRATIONS                                  ║   │
│  ║                                                                            ║   │
│  ║  @mcv/finance    @mcv/portfolio   @mcv/connectors   @mcv/web3-core        ║   │
│  ║  (Venture P&L,   (Venture data,   (Plaid bank       (Crypto treasury,     ║   │
│  ║   GL feeds)       legal entities)  feeds, Stripe)    Solana wallets)       ║   │
│  ║                                                                            ║   │
│  ║  @mcv/documents  @mcv/notifications  @mcv/payments   Mercury/SVB          ║   │
│  ║  (PDF gen for    (Tax alerts,        (Wire/ACH       (Banking API,        ║   │
│  ║   board pkgs)     investor updates)   processing)     direct banking)     ║   │
│  ╚════════════════════════════════════════════════════════════════════════════╝   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Module Architecture

### Cash Management Module

The cash module is the real-time nervous system for consortium liquidity. It tracks every bank account, every cash movement, every FX position, and projects future cash needs.

#### Service Architecture

```typescript
// ── CashService ─────────────────────────────────────────────────
// Primary service: bank account management, position tracking,
// movement recording, burn rate and runway calculations.

export class CashService {
  constructor(
    private db: DrizzleDatabase,
    private eventBus: EventBus,
    private cache: RedisCache,
    private plaidClient: PlaidClient,
  ) {}

  /**
   * Get consolidated cash position across all ventures.
   * Uses Redis cache with 5-minute TTL for repeated calls.
   * Falls back to real-time DB query on cache miss.
   */
  async getConsolidatedPosition(asOfDate?: Date): Promise<ConsolidatedCashPosition> {
    const cacheKey = `treasury:consolidated_position:${asOfDate?.toISOString() ?? 'latest'}`;
    const cached = await this.cache.get<ConsolidatedCashPosition>(cacheKey);
    if (cached) return cached;

    return withServiceRole('treasury:admin', async (db) => {
      // Aggregate balances across all ventures
      const accounts = await db
        .select({
          ventureId: treasuryBankAccounts.ventureId,
          currency: treasuryBankAccounts.currency,
          totalBalance: sql<string>`SUM(${treasuryBankAccounts.currentBalance})`,
          accountCount: sql<number>`COUNT(*)`,
        })
        .from(treasuryBankAccounts)
        .where(eq(treasuryBankAccounts.status, 'active'))
        .groupBy(treasuryBankAccounts.ventureId, treasuryBankAccounts.currency);

      // Calculate burn rate from rolling 30-day outflows
      const burnRate = await this.calculateBurnRate();

      // Calculate runway
      const totalCash = accounts.reduce(
        (sum, a) => sum.plus(a.totalBalance),
        new Decimal(0)
      );
      const dailyBurn = new Decimal(burnRate.dailyBurn);
      const runwayDays = dailyBurn.isZero()
        ? Infinity
        : totalCash.div(dailyBurn).toNumber();

      const result: ConsolidatedCashPosition = {
        totalBalance: totalCash.toFixed(4),
        totalBalanceUsd: totalCash.toFixed(4), // After FX conversion
        ventureBreakdown: this.buildVentureBreakdown(accounts),
        currencyBreakdown: this.buildCurrencyBreakdown(accounts),
        burnRate: burnRate.monthlyBurn,
        runwayDays: Math.floor(runwayDays),
        runwayMonths: Math.floor(runwayDays / 30),
        asOfDate: asOfDate ?? new Date(),
      };

      await this.cache.set(cacheKey, result, 300); // 5-minute TTL
      return result;
    });
  }

  /**
   * Record a cash movement. For inter-company transfers,
   * creates mirror entries on both sides.
   */
  async recordMovement(input: RecordCashMovementInput): Promise<CashMovement> {
    const validated = recordCashMovementSchema.parse(input);

    const movement = await this.db.transaction(async (tx) => {
      // Insert movement record
      const [record] = await tx
        .insert(cashMovements)
        .values({
          ventureId: validated.ventureId,
          movementType: validated.movementType,
          category: validated.category,
          subcategory: validated.subcategory,
          description: validated.description,
          amount: validated.amount,
          currency: validated.currency ?? 'USD',
          fromAccountId: validated.fromAccountId,
          toAccountId: validated.toAccountId,
          transactionDate: validated.transactionDate,
          reference: validated.reference,
          isInterCompany: validated.isInterCompany ?? false,
          counterpartyVentureId: validated.counterpartyVentureId,
          tags: validated.tags,
          status: 'completed',
        })
        .returning();

      // Update account balances
      if (validated.fromAccountId) {
        await tx
          .update(treasuryBankAccounts)
          .set({
            currentBalance: sql`${treasuryBankAccounts.currentBalance} - ${validated.amount}`,
            updatedAt: new Date(),
          })
          .where(eq(treasuryBankAccounts.id, validated.fromAccountId));
      }
      if (validated.toAccountId) {
        await tx
          .update(treasuryBankAccounts)
          .set({
            currentBalance: sql`${treasuryBankAccounts.currentBalance} + ${validated.amount}`,
            updatedAt: new Date(),
          })
          .where(eq(treasuryBankAccounts.id, validated.toAccountId));
      }

      // Check minimum balance alerts
      await this.checkMinimumBalanceAlerts(tx, validated.fromAccountId);

      return record;
    });

    // Invalidate cache
    await this.cache.delete(`treasury:consolidated_position:latest`);
    await this.cache.delete(`treasury:venture_position:${input.ventureId}`);

    // Publish event
    await this.eventBus.publish('treasury.cash.movement.recorded', {
      movementId: movement.id,
      ventureId: movement.ventureId,
      type: movement.movementType,
      amount: movement.amount,
      currency: movement.currency,
      isInterCompany: movement.isInterCompany,
    });

    return movement;
  }

  /**
   * Inter-company transfer creates mirror entries.
   * Source venture: outflow. Target venture: inflow.
   * Both tagged isInterCompany with cross-references.
   */
  async recordInterCompanyTransfer(
    input: InterCompanyTransferInput
  ): Promise<{ sourceMovement: CashMovement; targetMovement: CashMovement }> {
    return this.db.transaction(async (tx) => {
      // Source side: outflow
      const sourceMovement = await this.recordMovement({
        ventureId: input.sourceVentureId,
        movementType: 'outflow',
        category: 'intercompany',
        description: input.description,
        amount: input.amount,
        fromAccountId: input.sourceAccountId,
        transactionDate: input.transactionDate ?? new Date(),
        isInterCompany: true,
        counterpartyVentureId: input.targetVentureId,
      });

      // Target side: inflow
      const targetMovement = await this.recordMovement({
        ventureId: input.targetVentureId,
        movementType: 'inflow',
        category: 'intercompany',
        description: input.description,
        amount: input.amount,
        toAccountId: input.targetAccountId,
        transactionDate: input.transactionDate ?? new Date(),
        isInterCompany: true,
        counterpartyVentureId: input.sourceVentureId,
      });

      return { sourceMovement, targetMovement };
    });
  }

  /**
   * Daily position snapshot — runs via cron at 23:59 UTC.
   * Snapshots every active account and calculates burn/runway.
   */
  async snapshotDailyPositions(): Promise<CashPositionSnapshot[]> {
    return withServiceRole('treasury:admin', async (db) => {
      const accounts = await db
        .select()
        .from(treasuryBankAccounts)
        .where(eq(treasuryBankAccounts.status, 'active'));

      const snapshots: CashPositionSnapshot[] = [];
      const now = new Date();

      for (const account of accounts) {
        // Get today's movements for this account
        const todayMovements = await this.getTodayMovements(account.id);
        const inflows = todayMovements
          .filter(m => m.movementType === 'inflow' || m.toAccountId === account.id)
          .reduce((sum, m) => sum.plus(m.amount), new Decimal(0));
        const outflows = todayMovements
          .filter(m => m.movementType === 'outflow' || m.fromAccountId === account.id)
          .reduce((sum, m) => sum.plus(m.amount), new Decimal(0));

        const [snapshot] = await db
          .insert(cashPositions)
          .values({
            snapshotDate: now,
            ventureId: account.ventureId,
            bankAccountId: account.id,
            currency: account.currency,
            openingBalance: new Decimal(account.currentBalance).minus(inflows).plus(outflows).toFixed(4),
            inflows: inflows.toFixed(4),
            outflows: outflows.toFixed(4),
            netChange: inflows.minus(outflows).toFixed(4),
            closingBalance: account.currentBalance,
            closingBalanceUsd: account.currentBalance, // After FX
            burnRate: (await this.calculateBurnRate(account.ventureId)).monthlyBurn,
            runwayDays: (await this.calculateRunway(account.ventureId)).runwayDays,
            isConsolidated: false,
          })
          .returning();

        snapshots.push(snapshot);
      }

      // Create consolidated snapshot
      await this.createConsolidatedSnapshot(db, now);

      return snapshots;
    });
  }

  /**
   * Burn rate: rolling 30-day average of outflows,
   * excluding inter-company transfers and one-time items.
   */
  async calculateBurnRate(
    ventureId?: string,
    lookbackDays: number = 30
  ): Promise<BurnRateResult> {
    const startDate = subDays(new Date(), lookbackDays);

    const conditions = [
      eq(cashMovements.movementType, 'outflow'),
      eq(cashMovements.isInterCompany, false),
      gte(cashMovements.transactionDate, startDate),
      eq(cashMovements.status, 'completed'),
    ];

    if (ventureId) {
      conditions.push(eq(cashMovements.ventureId, ventureId));
    }

    const result = await this.db
      .select({
        totalOutflow: sql<string>`SUM(${cashMovements.amount})`,
      })
      .from(cashMovements)
      .where(and(...conditions));

    const totalOutflow = new Decimal(result[0]?.totalOutflow ?? '0');
    const dailyBurn = totalOutflow.div(lookbackDays);
    const monthlyBurn = dailyBurn.mul(30);

    return {
      dailyBurn: dailyBurn.toFixed(4),
      weeklyBurn: dailyBurn.mul(7).toFixed(4),
      monthlyBurn: monthlyBurn.toFixed(4),
      lookbackDays,
      totalOutflow: totalOutflow.toFixed(4),
    };
  }
}
```

#### Cash Forecast AI Pipeline

```typescript
// ── CashForecastService ─────────────────────────────────────────
// AI-powered cash forecasting with multiple methods:
// linear, seasonal, ml_ensemble, scenario analysis.

export class CashForecastService {
  constructor(
    private db: DrizzleDatabase,
    private cache: RedisCache,
    private ai: OpenRouterClient,
  ) {}

  /**
   * Generate a cash forecast using the specified method.
   * ML ensemble method uses OpenRouter AI for pattern detection.
   */
  async generateForecast(input: CashForecastInput): Promise<CashForecast> {
    const validated = cashForecastInputSchema.parse(input);
    const startDate = new Date();
    const endDate = addDays(startDate, validated.forecastHorizonDays);

    // Get historical data for training
    const historicalMovements = await this.getHistoricalMovements(
      validated.ventureId,
      365 // 1 year of history
    );

    // Get current cash position
    const currentCash = validated.ventureId
      ? await cashService.getVenturePosition(validated.ventureId)
      : await cashService.getConsolidatedPosition();

    let projections: DailyProjection[];

    switch (validated.method) {
      case 'linear':
        projections = this.linearForecast(historicalMovements, validated);
        break;
      case 'seasonal':
        projections = this.seasonalForecast(historicalMovements, validated);
        break;
      case 'ml_ensemble':
        projections = await this.mlEnsembleForecast(historicalMovements, validated);
        break;
      case 'scenario':
        projections = this.scenarioForecast(historicalMovements, validated);
        break;
    }

    // Calculate confidence intervals
    const { confidenceLevel, low, high } = this.calculateConfidenceInterval(
      projections,
      historicalMovements
    );

    // Store forecast
    const [forecast] = await this.db
      .insert(cashForecasts)
      .values({
        name: `${validated.method} ${validated.forecastHorizonDays}-day forecast`,
        ventureId: validated.ventureId,
        forecastHorizonDays: validated.forecastHorizonDays,
        startDate,
        endDate,
        method: validated.method,
        assumptions: validated.assumptions,
        startingCash: currentCash.totalBalance,
        projectedEndCash: projections[projections.length - 1].cumulativeBalance,
        projectedRunwayDays: this.calculateRunwayFromProjections(projections),
        confidenceLevel: confidenceLevel.toFixed(4),
        confidenceIntervalLow: low.toFixed(4),
        confidenceIntervalHigh: high.toFixed(4),
        status: 'active',
        generatedBy: validated.method === 'ml_ensemble' ? 'ai_agent' : 'system',
      })
      .returning();

    // Store individual forecast lines
    await this.storeForecastLines(forecast.id, projections);

    return forecast;
  }

  /**
   * ML Ensemble: uses OpenRouter AI to detect patterns
   * in historical cash flow data and project future flows.
   */
  private async mlEnsembleForecast(
    history: CashMovement[],
    input: CashForecastInput
  ): Promise<DailyProjection[]> {
    // Prepare structured data for AI
    const monthlyAggregates = this.aggregateByMonth(history);
    const categoryBreakdown = this.aggregateByCategory(history);

    const prompt = `Analyze this cash flow data for an enterprise consortium and project the next ${input.forecastHorizonDays} days.

Historical monthly cash flows (last 12 months):
${JSON.stringify(monthlyAggregates, null, 2)}

Category breakdown:
${JSON.stringify(categoryBreakdown, null, 2)}

Assumptions: ${JSON.stringify(input.assumptions ?? {})}

Provide daily projections as JSON array with: date, projectedInflow, projectedOutflow, projectedNet, cumulativeBalance.
Consider seasonality, growth trends, and known recurring expenses.`;

    const response = await this.ai.chat({
      model: 'openai/gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    return this.parseAIProjections(response, history);
  }
}
```

#### Sweep Automation Engine

```typescript
// ── SweepService ────────────────────────────────────────────────
// Automated sweep account management. Runs nightly to move
// excess funds from operating to savings/money market accounts.

export class SweepService {
  /**
   * Execute all due sweeps — called by nightly cron job.
   * For each active sweep rule, checks if conditions are met
   * and executes the transfer.
   */
  async executeAllDueSweeps(): Promise<SweepTransaction[]> {
    const activeSweeps = await this.db
      .select()
      .from(sweepAccounts)
      .where(
        and(
          eq(sweepAccounts.isActive, true),
          or(
            eq(sweepAccounts.triggerType, 'balance_threshold'),
            and(
              eq(sweepAccounts.triggerType, 'schedule'),
              this.isDueForSchedule()
            )
          )
        )
      );

    const results: SweepTransaction[] = [];

    for (const sweep of activeSweeps) {
      try {
        const sourceAccount = await this.db
          .select()
          .from(treasuryBankAccounts)
          .where(eq(treasuryBankAccounts.id, sweep.sourceAccountId))
          .then(rows => rows[0]);

        if (!sourceAccount) continue;

        const currentBalance = new Decimal(sourceAccount.currentBalance);
        const threshold = new Decimal(sweep.thresholdAmount ?? '0');
        const targetBalance = new Decimal(sweep.targetBalanceAmount ?? '0');

        // Check if sweep should execute
        let sweepAmount = new Decimal(0);

        if (sweep.direction === 'to_target' && currentBalance.gt(threshold)) {
          sweepAmount = currentBalance.minus(targetBalance);
        } else if (sweep.direction === 'to_source' && currentBalance.lt(threshold)) {
          sweepAmount = targetBalance.minus(currentBalance);
        }

        // Enforce minimum/maximum
        const minimum = new Decimal(sweep.minimumSweepAmount ?? '1000');
        const maximum = sweep.maximumSweepAmount
          ? new Decimal(sweep.maximumSweepAmount)
          : null;

        if (sweepAmount.lt(minimum)) continue;
        if (maximum && sweepAmount.gt(maximum)) sweepAmount = maximum;

        // Execute sweep
        const transaction = await this.executeSweep(sweep.id);
        results.push(transaction);
      } catch (error) {
        // Log failure but continue with other sweeps
        await this.recordFailedSweep(sweep.id, error.message);
      }
    }

    return results;
  }
}
```

### Funding & Capital Module

The funding module manages the capital lifecycle — from seed funding through Series rounds to potential IPO.

#### Cap Table Engine

```typescript
// ── CapTableService ─────────────────────────────────────────────
// Manages the cap table, share classes, dilution modeling,
// and vesting schedules for all ventures.

export class CapTableService {
  /**
   * Get the current cap table for a venture, including
   * ownership percentages and fully diluted calculations.
   */
  async getCapTable(ventureId: string): Promise<CapTableView> {
    const entries = await this.db
      .select()
      .from(capTableEntries)
      .where(
        and(
          eq(capTableEntries.ventureId, ventureId),
          eq(capTableEntries.isActive, true)
        )
      )
      .orderBy(desc(capTableEntries.sharesOwned));

    const shareClasses = await this.db
      .select()
      .from(shareClassesTable)
      .where(eq(shareClassesTable.ventureId, ventureId));

    // Calculate totals
    const totalShares = entries.reduce(
      (sum, e) => sum.plus(e.sharesOwned),
      new Decimal(0)
    );

    // Include options and warrants for fully diluted
    const optionPoolEntries = entries.filter(e => e.holderType === 'option_pool');
    const optionPoolShares = optionPoolEntries.reduce(
      (sum, e) => sum.plus(e.sharesOwned),
      new Decimal(0)
    );

    // Calculate SAFEs and notes that would convert
    const pendingSAFEs = await this.getPendingSAFEShares(ventureId);
    const pendingNotes = await this.getPendingNoteShares(ventureId);
    const fullyDilutedTotal = totalShares.plus(pendingSAFEs).plus(pendingNotes);

    // Calculate ownership percentages
    const enrichedEntries = entries.map(entry => ({
      ...entry,
      ownershipPercent: new Decimal(entry.sharesOwned)
        .div(totalShares)
        .mul(100)
        .toFixed(6),
      fullyDilutedPercent: new Decimal(entry.sharesOwned)
        .div(fullyDilutedTotal)
        .mul(100)
        .toFixed(6),
    }));

    return {
      ventureId,
      asOfDate: new Date(),
      totalSharesOutstanding: totalShares.toFixed(0),
      totalSharesFullyDiluted: fullyDilutedTotal.toFixed(0),
      optionPoolShares: optionPoolShares.toFixed(0),
      optionPoolPercent: optionPoolShares.div(fullyDilutedTotal).mul(100).toFixed(6),
      entries: enrichedEntries,
      shareClasses: this.summarizeShareClasses(shareClasses),
    };
  }

  /**
   * Model dilution from a hypothetical new round.
   * Takes current cap table and applies round parameters.
   */
  async modelDilution(
    ventureId: string,
    input: DilutionModelInput
  ): Promise<DilutionResult> {
    const currentCapTable = await this.getCapTable(ventureId);
    const currentTotal = new Decimal(currentCapTable.totalSharesFullyDiluted);

    // Convert any SAFEs
    let safeShares = new Decimal(0);
    const safeConversions: SAFEConversionDetail[] = [];
    for (const safeConv of input.safeConversions ?? []) {
      const safe = await this.db
        .select()
        .from(safeAgreements)
        .where(eq(safeAgreements.id, safeConv.safeId))
        .then(rows => rows[0]);

      if (!safe) continue;

      const conversionShares = new Decimal(safe.investmentAmount)
        .div(safeConv.conversionPrice);
      safeShares = safeShares.plus(conversionShares);
      safeConversions.push({
        safeId: safe.id,
        investmentAmount: safe.investmentAmount,
        conversionPrice: safeConv.conversionPrice,
        sharesIssued: conversionShares.toFixed(0),
      });
    }

    // Convert any notes
    let noteShares = new Decimal(0);
    const noteConversions: NoteConversionDetail[] = [];
    for (const noteConv of input.noteConversions ?? []) {
      const note = await this.db
        .select()
        .from(convertibleNotes)
        .where(eq(convertibleNotes.id, noteConv.noteId))
        .then(rows => rows[0]);

      if (!note) continue;

      const totalPrincipal = new Decimal(note.principalAmount)
        .plus(noteConv.accruedInterest);
      const conversionShares = totalPrincipal.div(noteConv.conversionPrice);
      noteShares = noteShares.plus(conversionShares);
      noteConversions.push({
        noteId: note.id,
        principalAmount: note.principalAmount,
        accruedInterest: noteConv.accruedInterest,
        conversionPrice: noteConv.conversionPrice,
        sharesIssued: conversionShares.toFixed(0),
      });
    }

    // Calculate new round shares
    const newRoundShares = new Decimal(input.newShares);
    const optionPoolIncrease = new Decimal(input.optionPoolIncrease ?? '0');

    // Post-money fully diluted total
    const postTotal = currentTotal
      .plus(safeShares)
      .plus(noteShares)
      .plus(newRoundShares)
      .plus(optionPoolIncrease);

    // Build pre/post ownership tables
    const preRound = this.buildOwnershipTable(currentCapTable.entries, currentTotal);
    const postRound = this.buildPostRoundOwnership(
      currentCapTable.entries,
      postTotal,
      newRoundShares,
      safeConversions,
      noteConversions,
      optionPoolIncrease
    );

    // Calculate dilution percentages
    const founderPre = preRound.find(o => o.category === 'founders')?.percent ?? '0';
    const founderPost = postRound.find(o => o.category === 'founders')?.percent ?? '0';
    const founderDilution = new Decimal(founderPre).minus(founderPost).toFixed(4);
    const totalDilution = new Decimal(1)
      .minus(currentTotal.div(postTotal))
      .mul(100)
      .toFixed(4);

    // Store model
    const [model] = await this.db
      .insert(dilutionModels)
      .values({
        ventureId,
        name: `Dilution model — ${new Date().toISOString()}`,
        assumptions: input,
        results: { preRound, postRound, founderDilution, totalDilution },
      })
      .returning();

    return {
      modelId: model.id,
      preRound: { entries: preRound },
      postRound: { entries: postRound },
      totalDilution,
      founderDilution,
      newSharesIssued: newRoundShares.toFixed(0),
      optionPoolIncrease: optionPoolIncrease.toFixed(0),
      safeConversions,
      noteConversions,
    };
  }
}
```

#### SAFE Conversion Engine

```typescript
// ── SAFE Conversion Logic ───────────────────────────────────────
// Handles post-money, pre-money, MFN, and pro-rata SAFEs.

export class FundingService {
  /**
   * Convert a SAFE to equity shares during a priced round.
   * Applies the lower of cap price or discount price.
   */
  async convertSAFE(
    safeId: string,
    roundId: string,
    conversionPrice: string
  ): Promise<{ safe: SAFEAgreement; shares: ShareIssuance }> {
    const safe = await this.db
      .select()
      .from(safeAgreements)
      .where(eq(safeAgreements.id, safeId))
      .then(rows => rows[0]);

    if (!safe) throw new TreasuryError('TREASURY_SAFE_NOT_FOUND');
    if (safe.status !== 'active') throw new TreasuryError('TREASURY_SAFE_ALREADY_CONVERTED');

    const round = await this.getRound(roundId);
    const roundPrice = new Decimal(conversionPrice);

    // Step 1: Calculate cap price (if valuation cap exists)
    let capPrice: Decimal | null = null;
    if (safe.valuationCap) {
      const fullyDilutedShares = await this.getFullyDilutedShareCount(safe.ventureId);
      capPrice = new Decimal(safe.valuationCap).div(fullyDilutedShares);
    }

    // Step 2: Calculate discount price (if discount rate exists)
    let discountPrice: Decimal | null = null;
    if (safe.discountRate) {
      discountPrice = roundPrice.mul(
        new Decimal(1).minus(new Decimal(safe.discountRate))
      );
    }

    // Step 3: Use the lower price (better for investor)
    const prices = [capPrice, discountPrice, roundPrice].filter(Boolean) as Decimal[];
    const effectivePrice = Decimal.min(...prices);

    // Step 4: Calculate shares
    const sharesIssued = new Decimal(safe.investmentAmount)
      .div(effectivePrice)
      .floor(); // Round down to whole shares

    return this.db.transaction(async (tx) => {
      // Update SAFE status
      const [updatedSafe] = await tx
        .update(safeAgreements)
        .set({
          status: 'converted',
          convertedAt: new Date(),
          conversionRoundId: roundId,
          conversionShares: sharesIssued.toFixed(0),
          conversionPricePerShare: effectivePrice.toFixed(8),
          updatedAt: new Date(),
        })
        .where(eq(safeAgreements.id, safeId))
        .returning();

      // Issue shares
      const shares = await capTableService.issueShares({
        ventureId: safe.ventureId,
        shareClassId: round.shareClass,
        roundId,
        recipientName: safe.investorId,
        recipientType: 'investor',
        sharesIssued: sharesIssued.toFixed(0),
        pricePerShare: effectivePrice.toFixed(8),
        totalConsideration: safe.investmentAmount,
        issuanceType: 'conversion',
      });

      // Publish event
      await this.eventBus.publish('treasury.funding.safe.converted', {
        safeId,
        roundId,
        investorId: safe.investorId,
        sharesIssued: sharesIssued.toFixed(0),
        conversionPrice: effectivePrice.toFixed(8),
      });

      return { safe: updatedSafe, shares };
    });
  }
}
```

### P&L Consolidation Module

The P&L module aggregates financials across all ventures, eliminates inter-company transactions, and produces the consolidated financial statements.

#### Consolidation Engine

```typescript
// ── PnlService ──────────────────────────────────────────────────
// Consolidation engine: aggregates venture P&Ls, applies
// IC eliminations, and produces consolidated financial statements.

export class PnlService {
  /**
   * Run consolidation for a given period.
   * This is the core operation — pulls venture data, identifies IC,
   * applies elimination rules, and produces consolidated P&L.
   */
  async runConsolidation(input: ConsolidatedPnlInput): Promise<ConsolidatedPnlResult> {
    const validated = consolidatedPnlInputSchema.parse(input);

    // Prevent concurrent consolidations
    const existing = await this.db
      .select()
      .from(consolidationRuns)
      .where(
        and(
          eq(consolidationRuns.period, validated.period),
          eq(consolidationRuns.status, 'running')
        )
      );

    if (existing.length > 0) {
      throw new TreasuryError('TREASURY_CONSOLIDATION_IN_PROGRESS');
    }

    // Start consolidation run
    const [run] = await this.db
      .insert(consolidationRuns)
      .values({
        period: validated.period,
        periodType: validated.periodType,
        startedAt: new Date(),
        ventureCount: 9,
        status: 'running',
        triggeredBy: 'api',
      })
      .returning();

    try {
      return await withServiceRole('treasury:admin', async (db) => {
        // STEP 1: Fetch P&L data from ALL ventures via @mcv/finance
        const venturePnls = await this.fetchVenturePnlData(validated.period);

        // STEP 2: Aggregate pre-elimination totals
        const preElimination = this.aggregatePnls(venturePnls);

        // STEP 3: Fetch inter-company transactions for the period
        const icTransactions = await db
          .select()
          .from(interCompanyTransactions)
          .where(
            and(
              eq(interCompanyTransactions.period, validated.period),
              eq(interCompanyTransactions.status, 'confirmed')
            )
          );

        // STEP 4: Apply elimination rules
        const eliminations = await eliminationService.matchAndEliminate(
          validated.period
        );

        const totalRevenueEliminations = eliminations
          .filter(e => e.eliminationType === 'revenue')
          .reduce((sum, e) => sum.plus(e.amount), new Decimal(0));

        const totalExpenseEliminations = eliminations
          .filter(e => e.eliminationType === 'cogs' || e.eliminationType === 'payable')
          .reduce((sum, e) => sum.plus(e.amount), new Decimal(0));

        // STEP 5: Apply currency translations (ASC 830)
        const translations = await this.applyCurrencyTranslations(
          venturePnls,
          validated.period
        );

        // STEP 6: Calculate consolidated figures
        const totalRevenue = preElimination.totalRevenue
          .minus(totalRevenueEliminations);
        const totalExpenses = preElimination.totalExpenses
          .minus(totalExpenseEliminations);
        const grossProfit = totalRevenue.minus(preElimination.totalCogs);
        const operatingIncome = grossProfit.minus(preElimination.totalOpex);
        const ebitda = operatingIncome
          .plus(preElimination.depreciation)
          .plus(preElimination.amortization);
        const preTaxIncome = operatingIncome
          .plus(preElimination.otherIncome)
          .minus(preElimination.otherExpenses)
          .minus(preElimination.interestExpense);
        const netIncome = preTaxIncome.minus(preElimination.taxProvision);

        // STEP 7: Store consolidated P&L
        const [consolidatedRecord] = await db
          .insert(consolidatedPnl)
          .values({
            period: validated.period,
            periodType: validated.periodType,
            consolidationMethod: validated.consolidationMethod,
            status: 'preliminary',
            totalRevenue: totalRevenue.toFixed(4),
            totalRevenuePreElimination: preElimination.totalRevenue.toFixed(4),
            revenueEliminations: totalRevenueEliminations.toFixed(4),
            totalCogs: preElimination.totalCogs.toFixed(4),
            grossProfit: grossProfit.toFixed(4),
            grossMargin: grossProfit.div(totalRevenue).mul(100).toFixed(4),
            totalOpex: preElimination.totalOpex.toFixed(4),
            totalExpenses: totalExpenses.toFixed(4),
            totalExpensesPreElimination: preElimination.totalExpenses.toFixed(4),
            expenseEliminations: totalExpenseEliminations.toFixed(4),
            operatingIncome: operatingIncome.toFixed(4),
            ebitda: ebitda.toFixed(4),
            preTaxIncome: preTaxIncome.toFixed(4),
            taxProvision: preElimination.taxProvision.toFixed(4),
            netIncome: netIncome.toFixed(4),
            netMargin: netIncome.div(totalRevenue).mul(100).toFixed(4),
            ventureCount: venturePnls.length,
            consolidationRunId: run.id,
          })
          .returning();

        // STEP 8: Store line items and segment results
        await this.storeLineItems(db, consolidatedRecord.id, venturePnls, eliminations);
        await this.storeSegmentResults(db, consolidatedRecord.id, venturePnls, validated.period);

        // STEP 9: Complete consolidation run
        await db
          .update(consolidationRuns)
          .set({
            completedAt: new Date(),
            status: 'completed',
            eliminationsApplied: eliminations.length,
            eliminationTotal: totalRevenueEliminations.plus(totalExpenseEliminations).toFixed(4),
            currencyTranslations: translations,
          })
          .where(eq(consolidationRuns.id, run.id));

        // STEP 10: Publish event
        await this.eventBus.publish('treasury.pnl.consolidation.completed', {
          period: validated.period,
          consolidatedPnlId: consolidatedRecord.id,
          netIncome: netIncome.toFixed(4),
          eliminationsApplied: eliminations.length,
        });

        return consolidatedRecord;
      });
    } catch (error) {
      // Mark run as failed
      await this.db
        .update(consolidationRuns)
        .set({
          status: 'failed',
          errorLog: error.message,
        })
        .where(eq(consolidationRuns.id, run.id));

      throw error;
    }
  }
}
```

#### Elimination Engine

```typescript
// ── EliminationService ──────────────────────────────────────────
// Identifies and eliminates inter-company transactions.

export class EliminationService {
  /**
   * Auto-match inter-company transactions and create
   * elimination entries based on configured rules.
   */
  async matchAndEliminate(period: string): Promise<EliminationEntry[]> {
    // Get all confirmed IC transactions for the period
    const icTransactions = await this.db
      .select()
      .from(interCompanyTransactions)
      .where(
        and(
          eq(interCompanyTransactions.period, period),
          eq(interCompanyTransactions.status, 'confirmed'),
          eq(interCompanyTransactions.isEliminated, false)
        )
      );

    // Get active elimination rules, ordered by priority
    const rules = await this.db
      .select()
      .from(eliminationRules)
      .where(eq(eliminationRules.isActive, true))
      .orderBy(desc(eliminationRules.priority));

    const entries: EliminationEntry[] = [];

    // Match transaction pairs
    for (const sourceTransaction of icTransactions) {
      // Find matching counterparty transaction
      const match = icTransactions.find(
        t =>
          t.id !== sourceTransaction.id &&
          t.sourceVentureId === sourceTransaction.targetVentureId &&
          t.targetVentureId === sourceTransaction.sourceVentureId &&
          new Decimal(t.amount).equals(new Decimal(sourceTransaction.amount))
      );

      if (!match) continue; // Unmatched — will be flagged for manual review

      // Find applicable rule
      const rule = rules.find(r => this.ruleMatches(r, sourceTransaction));

      // Create elimination entry
      const [entry] = await this.db
        .insert(eliminationEntries)
        .values({
          period,
          eliminationRuleId: rule?.id,
          sourceVentureId: sourceTransaction.sourceVentureId,
          targetVentureId: sourceTransaction.targetVentureId,
          eliminationType: sourceTransaction.transactionType as any,
          debitAccount: `${sourceTransaction.transactionType}_elimination_dr`,
          creditAccount: `${sourceTransaction.transactionType}_elimination_cr`,
          amount: sourceTransaction.amount,
          interCompanyTransactionId: sourceTransaction.id,
          description: `IC elimination: ${sourceTransaction.description}`,
          status: 'applied',
        })
        .returning();

      // Mark transactions as eliminated
      await this.db
        .update(interCompanyTransactions)
        .set({ isEliminated: true, eliminationEntryId: entry.id })
        .where(
          inArray(interCompanyTransactions.id, [sourceTransaction.id, match.id])
        );

      entries.push(entry);
    }

    return entries;
  }

  /**
   * Get transactions that couldn't be matched automatically.
   * These require manual review and elimination.
   */
  async getUnmatchedTransactions(period: string): Promise<InterCompanyTransaction[]> {
    return this.db
      .select()
      .from(interCompanyTransactions)
      .where(
        and(
          eq(interCompanyTransactions.period, period),
          eq(interCompanyTransactions.isEliminated, false),
          eq(interCompanyTransactions.status, 'confirmed')
        )
      );
  }
}
```

#### Variance Analysis with AI Narratives

```typescript
// ── VarianceService ─────────────────────────────────────────────
// Budget vs. Actual analysis with AI-generated explanations.

export class VarianceService {
  /**
   * Run budget vs actual analysis for a period.
   * Identifies material variances and generates AI narrative.
   */
  async runBudgetVsActual(input: BudgetVsActualInput): Promise<VarianceReport> {
    const validated = budgetVsActualSchema.parse(input);
    const threshold = new Decimal(validated.materialityThreshold ?? '5000');

    // Get actual P&L data
    const actualPnl = await pnlService.getConsolidatedPnl(validated.period);

    // Get budget data
    const budgets = await this.db
      .select()
      .from(pnlBudgets)
      .where(
        and(
          eq(pnlBudgets.period, validated.period),
          validated.ventureId
            ? eq(pnlBudgets.ventureId, validated.ventureId)
            : isNull(pnlBudgets.ventureId)
        )
      );

    // Build variance lines
    const varianceLineItems: VarianceLine[] = [];
    let totalFavorable = new Decimal(0);
    let totalUnfavorable = new Decimal(0);

    for (const budget of budgets) {
      const actual = this.findActualForCategory(actualPnl, budget.category);
      const variance = new Decimal(actual).minus(new Decimal(budget.budgetAmount));
      const variancePercent = new Decimal(budget.budgetAmount).isZero()
        ? new Decimal(0)
        : variance.div(new Decimal(budget.budgetAmount)).mul(100);

      // Determine direction
      const isRevenue = budget.category.includes('revenue');
      const direction: 'favorable' | 'unfavorable' | 'neutral' =
        variance.isZero() ? 'neutral' :
        (isRevenue && variance.gt(0)) || (!isRevenue && variance.lt(0))
          ? 'favorable' : 'unfavorable';

      const isMaterial = variance.abs().gte(threshold);

      if (direction === 'favorable') totalFavorable = totalFavorable.plus(variance.abs());
      if (direction === 'unfavorable') totalUnfavorable = totalUnfavorable.plus(variance.abs());

      varianceLineItems.push({
        category: budget.category,
        subcategory: budget.subcategory,
        actualAmount: actual,
        budgetAmount: budget.budgetAmount,
        varianceAmount: variance.toFixed(4),
        variancePercent: variancePercent.toFixed(4),
        direction,
        isMaterial,
      });
    }

    // Generate AI narrative for material items
    let narrative: string | undefined;
    if (validated.generateNarrative) {
      const materialItems = varianceLineItems.filter(v => v.isMaterial);
      narrative = await this.generateNarrative(materialItems, validated.period);
    }

    // Store report
    const [report] = await this.db
      .insert(varianceReports)
      .values({
        name: `${validated.period} Budget vs Actual Analysis`,
        period: validated.period,
        varianceType: 'budget_vs_actual',
        ventureId: validated.ventureId,
        totalFavorableVariance: totalFavorable.toFixed(4),
        totalUnfavorableVariance: totalUnfavorable.toFixed(4),
        netVariance: totalFavorable.minus(totalUnfavorable).toFixed(4),
        materialityThreshold: threshold.toFixed(4),
        materialItems: varianceLineItems.filter(v => v.isMaterial),
        narrative,
        status: 'draft',
      })
      .returning();

    // Store variance lines
    for (const line of varianceLineItems) {
      await this.db.insert(varianceLines).values({
        varianceReportId: report.id,
        ...line,
      });
    }

    return report;
  }

  /**
   * AI-generated variance narrative using OpenRouter.
   */
  private async generateNarrative(
    materialItems: VarianceLine[],
    period: string
  ): Promise<string> {
    const prompt = `As a CFO writing a variance analysis for period ${period}, explain these material variances in 2-3 paragraphs:

${materialItems.map(item => `${item.category}: ${item.direction} variance of $${Math.abs(Number(item.varianceAmount)).toLocaleString()} (${item.variancePercent}%)`).join('\n')}

Focus on business impact and recommended actions. Be concise and professional.`;

    const response = await this.ai.chat({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content;
  }
}
```

### Tax Compliance Module

The tax module manages multi-jurisdiction compliance, estimated payments, transfer pricing, and ASC 740 provisions.

#### Tax Calendar Engine

```typescript
// ── TaxCalendarService ──────────────────────────────────────────
// Manages the tax calendar across all entities and jurisdictions.

export class TaxCalendarService {
  /**
   * Auto-generate all known tax deadlines for a year.
   * Called at the start of each fiscal year.
   */
  async generateAnnualCalendar(taxYear: number): Promise<TaxCalendarEvent[]> {
    const events: TaxCalendarEvent[] = [];

    // Get all entity-jurisdiction mappings
    const mappings = await this.db
      .select({
        entity: taxEntities,
        jurisdiction: taxJurisdictions,
        mapping: taxEntityJurisdictions,
      })
      .from(taxEntityJurisdictions)
      .innerJoin(taxEntities, eq(taxEntities.id, taxEntityJurisdictions.taxEntityId))
      .innerJoin(taxJurisdictions, eq(taxJurisdictions.id, taxEntityJurisdictions.jurisdictionId))
      .where(eq(taxEntityJurisdictions.filingStatus, 'active'));

    for (const { entity, jurisdiction, mapping } of mappings) {
      // Generate estimated payment deadlines
      const estimatedDates = jurisdiction.estimatedPaymentDates as string[];
      if (estimatedDates) {
        for (let q = 0; q < estimatedDates.length; q++) {
          const [month, day] = estimatedDates[q].split('-').map(Number);
          const adjustedYear = month < 4 ? taxYear + 1 : taxYear; // Q4 due in Jan next year
          const dueDate = new Date(adjustedYear, month - 1, day);

          const [event] = await this.db
            .insert(taxCalendarEvents)
            .values({
              taxEntityId: entity.id,
              jurisdictionId: jurisdiction.id,
              eventName: `Q${q + 1} ${jurisdiction.jurisdictionName} Estimated Payment — ${entity.entityName}`,
              eventType: 'payment_deadline',
              dueDate,
              reminderDays: 14,
              isRecurring: true,
              status: 'upcoming',
              priority: 'high',
            })
            .returning();

          events.push(event);
        }
      }

      // Generate filing deadlines
      const filingDeadlines = jurisdiction.filingDeadlines as Record<string, string>;
      if (filingDeadlines?.annual) {
        const [month, day] = filingDeadlines.annual.split('-').map(Number);
        const dueDate = new Date(taxYear + 1, month - 1, day); // File next year

        const [event] = await this.db
          .insert(taxCalendarEvents)
          .values({
            taxEntityId: entity.id,
            jurisdictionId: jurisdiction.id,
            eventName: `Annual Return Filing — ${entity.entityName} — ${jurisdiction.jurisdictionName}`,
            eventType: 'filing_deadline',
            dueDate,
            reminderDays: 30,
            isRecurring: true,
            status: 'upcoming',
            priority: 'critical',
          })
          .returning();

        events.push(event);
      }
    }

    return events;
  }

  /**
   * Send reminders for upcoming deadlines — cron: daily 08:00 UTC.
   */
  async sendReminders(): Promise<void> {
    const upcoming = await this.db
      .select()
      .from(taxCalendarEvents)
      .where(
        and(
          eq(taxCalendarEvents.status, 'upcoming'),
          eq(taxCalendarEvents.reminderSent, false),
          lte(
            taxCalendarEvents.dueDate,
            addDays(new Date(), 14) // 14-day lookahead
          )
        )
      );

    for (const event of upcoming) {
      const daysUntil = differenceInDays(new Date(event.dueDate), new Date());

      await notificationService.send({
        channel: 'treasury_tax',
        type: event.priority === 'critical' ? 'urgent' : 'info',
        title: `Tax Deadline: ${daysUntil} days`,
        body: `${event.eventName} — Due: ${format(new Date(event.dueDate), 'MMM dd, yyyy')}`,
        recipients: ['cfo', event.assignedTo].filter(Boolean),
      });

      await this.db
        .update(taxCalendarEvents)
        .set({ reminderSent: true })
        .where(eq(taxCalendarEvents.id, event.id));
    }
  }
}
```

#### ASC 740 Tax Provision Engine

```typescript
// ── TaxProvisionService ─────────────────────────────────────────
// ASC 740 tax provision calculations with rate reconciliation.

export class TaxProvisionService {
  /**
   * Generate quarterly/annual tax provision.
   * Calculates current + deferred tax expense by jurisdiction.
   */
  async generateProvision(input: TaxProvisionInput): Promise<TaxProvisionResult> {
    const validated = taxProvisionInputSchema.parse(input);

    const preTaxIncome = new Decimal(validated.preTaxBookIncome);
    const permanentDiffs = new Decimal(validated.permanentDifferences ?? '0');
    const temporaryDiffs = new Decimal(validated.temporaryDifferences ?? '0');

    // Taxable income = book income + permanent differences + temporary differences
    const taxableIncome = preTaxIncome.plus(permanentDiffs).plus(temporaryDiffs);

    // Get all entity-jurisdiction combinations
    const entityJurisdictions = await this.getActiveEntityJurisdictions();

    // Calculate by jurisdiction
    const components: TaxProvisionComponent[] = [];
    let totalCurrentTax = new Decimal(0);
    let totalDeferredTax = new Decimal(0);

    for (const ej of entityJurisdictions) {
      // Apportion income to this jurisdiction
      const apportionedIncome = taxableIncome.mul(
        new Decimal(ej.mapping.apportionmentPercent ?? '1')
      );

      // Current tax
      const currentRate = new Decimal(ej.jurisdiction.corporateTaxRate ?? '0');
      const currentTax = apportionedIncome.mul(currentRate);
      totalCurrentTax = totalCurrentTax.plus(currentTax);

      // Deferred tax from temporary differences
      const deferredTax = new Decimal(temporaryDiffs)
        .mul(new Decimal(ej.mapping.apportionmentPercent ?? '1'))
        .mul(currentRate);
      totalDeferredTax = totalDeferredTax.plus(deferredTax);

      components.push({
        jurisdictionId: ej.jurisdiction.id,
        jurisdictionName: ej.jurisdiction.jurisdictionName,
        componentType: 'current',
        taxableIncome: apportionedIncome.toFixed(4),
        taxRate: currentRate.toFixed(6),
        taxAmount: currentTax.toFixed(4),
        credits: '0',
        netTax: currentTax.toFixed(4),
      });

      if (!deferredTax.isZero()) {
        components.push({
          jurisdictionId: ej.jurisdiction.id,
          jurisdictionName: ej.jurisdiction.jurisdictionName,
          componentType: 'deferred',
          taxableIncome: temporaryDiffs.mul(new Decimal(ej.mapping.apportionmentPercent ?? '1')).toFixed(4),
          taxRate: currentRate.toFixed(6),
          taxAmount: deferredTax.toFixed(4),
          credits: '0',
          netTax: deferredTax.toFixed(4),
        });
      }
    }

    // Apply R&D credits
    const rdCredits = await this.getApplicableRDCredits(validated.period);
    const totalCredits = rdCredits.reduce(
      (sum, c) => sum.plus(c.creditAmount ?? '0'),
      new Decimal(0)
    );
    totalCurrentTax = totalCurrentTax.minus(totalCredits);

    // Total provision
    const totalProvision = totalCurrentTax.plus(totalDeferredTax);
    const effectiveRate = preTaxIncome.isZero()
      ? new Decimal(0)
      : totalProvision.div(preTaxIncome);

    // Rate reconciliation
    const rateReconciliation = this.buildRateReconciliation(
      new Decimal('0.21'), // Statutory rate
      effectiveRate,
      components,
      totalCredits,
      permanentDiffs,
      preTaxIncome
    );

    // Store provision
    const [provision] = await this.db
      .insert(taxProvisions)
      .values({
        period: validated.period,
        periodType: validated.periodType,
        preTaxBookIncome: validated.preTaxBookIncome,
        permanentDifferences: permanentDiffs.toFixed(4),
        temporaryDifferences: temporaryDiffs.toFixed(4),
        taxableIncome: taxableIncome.toFixed(4),
        currentTaxExpense: totalCurrentTax.toFixed(4),
        deferredTaxExpense: totalDeferredTax.toFixed(4),
        totalTaxProvision: totalProvision.toFixed(4),
        effectiveTaxRate: effectiveRate.toFixed(6),
        statutoryRate: '0.21',
        rateReconciliation,
        status: 'draft',
      })
      .returning();

    // Store components
    for (const component of components) {
      await this.db.insert(taxProvisionComponents).values({
        provisionId: provision.id,
        ...component,
      });
    }

    return {
      ...provision,
      componentsByJurisdiction: components,
      rateReconciliation,
    };
  }

  /**
   * Build the rate reconciliation from statutory to effective rate.
   */
  private buildRateReconciliation(
    statutoryRate: Decimal,
    effectiveRate: Decimal,
    components: TaxProvisionComponent[],
    totalCredits: Decimal,
    permanentDiffs: Decimal,
    preTaxIncome: Decimal
  ): RateReconciliationItem[] {
    const stateNetRate = components
      .filter(c => c.componentType === 'current' && !c.jurisdictionName.includes('Federal'))
      .reduce((sum, c) => sum.plus(new Decimal(c.taxRate).mul(new Decimal(1).minus(statutoryRate))), new Decimal(0));

    const creditRate = preTaxIncome.isZero()
      ? new Decimal(0)
      : totalCredits.div(preTaxIncome).neg();

    const permanentDiffRate = preTaxIncome.isZero()
      ? new Decimal(0)
      : permanentDiffs.mul(statutoryRate).div(preTaxIncome);

    return [
      { item: 'Statutory federal rate', rate: statutoryRate.mul(100).toFixed(2) + '%', amount: preTaxIncome.mul(statutoryRate).toFixed(4) },
      { item: 'State taxes, net of federal benefit', rate: stateNetRate.mul(100).toFixed(2) + '%', amount: preTaxIncome.mul(stateNetRate).toFixed(4) },
      { item: 'R&D tax credits', rate: creditRate.mul(100).toFixed(2) + '%', amount: totalCredits.neg().toFixed(4) },
      { item: 'Permanent differences', rate: permanentDiffRate.mul(100).toFixed(2) + '%', amount: permanentDiffs.mul(statutoryRate).toFixed(4) },
      { item: 'Effective tax rate', rate: effectiveRate.mul(100).toFixed(2) + '%', amount: preTaxIncome.mul(effectiveRate).toFixed(4) },
    ];
  }
}
```

---

## Data Models & Schema

### Complete Schema Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    @mcv/treasury DATABASE SCHEMA                         │
│                    62 Tables · PostgreSQL + Supabase RLS                  │
│                                                                          │
│  CASH (14 tables)                   FUNDING (16 tables)                  │
│  ├── treasury_bank_accounts         ├── treasury_funding_rounds_v2       │
│  ├── treasury_cash_positions        ├── treasury_investors               │
│  ├── treasury_cash_movements        ├── treasury_investor_entities       │
│  ├── treasury_cash_forecasts        ├── treasury_funding_round_investors │
│  ├── treasury_cash_forecast_lines   ├── treasury_safe_agreements         │
│  ├── treasury_sweep_accounts        ├── treasury_convertible_notes       │
│  ├── treasury_sweep_transactions    ├── treasury_cap_table_entries       │
│  ├── treasury_cash_pools            ├── treasury_cap_table_snapshots     │
│  ├── treasury_cash_pool_allocations ├── treasury_share_classes           │
│  ├── treasury_wire_transfers        ├── treasury_share_issuances         │
│  ├── treasury_ach_batches           ├── treasury_vesting_schedules       │
│  ├── treasury_ach_transactions      ├── treasury_vesting_events          │
│  ├── treasury_fx_positions          ├── treasury_dilution_models         │
│  └── treasury_fx_transactions       ├── treasury_distribution_waterfalls │
│                                     ├── treasury_investor_reports        │
│                                     └── treasury_investor_communications │
│                                                                          │
│  PNL (14 tables)                    TAX (18 tables)                      │
│  ├── treasury_consolidated_pnl      ├── treasury_tax_entities            │
│  ├── treasury_consolidated_pnl_lines├── treasury_tax_jurisdictions       │
│  ├── treasury_venture_segments      ├── treasury_tax_entity_jurisdictions│
│  ├── treasury_segment_results       ├── treasury_estimated_tax_payments  │
│  ├── treasury_inter_company_txns    ├── treasury_tax_calendar_events     │
│  ├── treasury_elimination_rules     ├── treasury_transfer_pricing_studies│
│  ├── treasury_elimination_entries   ├── treasury_transfer_pricing_txns   │
│  ├── treasury_variance_reports      ├── treasury_transfer_pricing_benchs │
│  ├── treasury_variance_lines        ├── treasury_rd_credits              │
│  ├── treasury_management_reports    ├── treasury_rd_credit_activities    │
│  ├── treasury_board_packages        ├── treasury_withholding_tax_records │
│  ├── treasury_board_package_items   ├── treasury_tax_provisions          │
│  ├── treasury_consolidation_runs    ├── treasury_tax_provision_components│
│  ├── treasury_pnl_budgets           ├── treasury_deferred_tax_items      │
│  └── treasury_pnl_forecasts         ├── treasury_tax_returns             │
│                                     ├── treasury_tax_return_workpapers   │
│                                     ├── treasury_consolidated_tax_data   │
│                                     └── treasury_tax_audit_trail         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Entity Relationships

```
treasury_bank_accounts ──┬── cash_positions (1:many, daily snapshots)
                         ├── cash_movements (1:many, from/to accounts)
                         ├── sweep_accounts (1:many, source/target)
                         ├── cash_pool_allocations (1:many, participant)
                         ├── wire_transfers (1:many, from/to accounts)
                         └── ach_batches (1:many, from account)

investors ──┬── investor_entities (1:many, legal entities)
            ├── funding_round_investors (1:many, per round)
            ├── safe_agreements (1:many, per venture)
            ├── convertible_notes (1:many, per venture)
            ├── investor_reports (1:many, periodic)
            └── investor_communications (1:many, log)

funding_rounds_v2 ──┬── funding_round_investors (1:many, participants)
                    ├── safe_agreements (1:many, round-linked)
                    ├── convertible_notes (1:many, round-linked)
                    ├── cap_table_entries (1:many, from round)
                    └── share_issuances (1:many, from round)

consolidated_pnl ──┬── consolidated_pnl_lines (1:many, line items)
                   ├── segment_results (1:many, per segment)
                   ├── variance_reports (1:many, analyses)
                   ├── management_reports (1:many, reports)
                   └── board_packages (1:many, packages)

tax_entities ──┬── tax_entity_jurisdictions (1:many, registrations)
               ├── estimated_tax_payments (1:many, per quarter)
               ├── transfer_pricing_studies (1:many, source/target)
               ├── rd_credits (1:many, per year)
               ├── deferred_tax_items (1:many, items)
               ├── tax_returns (1:many, filings)
               └── tax_audit_trail (1:many, actions)
```

### Enum Definitions

```typescript
// ── Cash Enums ──────────────────────────────────────────────────
export const bankAccountTypeEnum = pgEnum('bank_account_type', [
  'checking', 'savings', 'money_market', 'sweep', 'crypto_wallet'
]);
export const cashMovementTypeEnum = pgEnum('cash_movement_type', [
  'inflow', 'outflow', 'transfer', 'sweep', 'fx_conversion'
]);
export const sweepDirectionEnum = pgEnum('sweep_direction', [
  'to_target', 'to_source', 'bidirectional'
]);
export const wireStatusEnum = pgEnum('wire_status', [
  'pending', 'approved', 'sent', 'completed', 'failed', 'cancelled'
]);

// ── Funding Enums ───────────────────────────────────────────────
export const roundTypeEnum = pgEnum('round_type', [
  'pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'bridge', 'ipo'
]);
export const instrumentTypeEnum = pgEnum('instrument_type', [
  'equity', 'safe', 'convertible_note', 'warrant'
]);
export const safeTypeEnum = pgEnum('safe_type', [
  'post_money', 'pre_money', 'mfn', 'pro_rata'
]);
export const vestingTypeEnum = pgEnum('vesting_type', [
  'time_based', 'milestone', 'hybrid'
]);

// ── PnL Enums ───────────────────────────────────────────────────
export const consolidationMethodEnum = pgEnum('consolidation_method', [
  'full', 'proportional', 'equity'
]);
export const eliminationTypeEnum = pgEnum('elimination_type', [
  'revenue', 'cogs', 'payable', 'receivable', 'loan', 'equity'
]);
export const varianceTypeEnum = pgEnum('variance_type', [
  'budget_vs_actual', 'forecast_vs_actual', 'period_over_period'
]);
export const reportFrequencyEnum = pgEnum('report_frequency', [
  'monthly', 'quarterly', 'annual'
]);

// ── Tax Enums ───────────────────────────────────────────────────
export const taxEntityTypeEnum = pgEnum('tax_entity_type', [
  'c_corp', 's_corp', 'llc', 'partnership', 'sole_prop', 'foreign'
]);
export const filingStatusEnum = pgEnum('filing_status', [
  'active', 'exempt', 'suspended'
]);
export const transferPricingMethodEnum = pgEnum('transfer_pricing_method', [
  'cup', 'resale_price', 'cost_plus', 'tnmm', 'profit_split'
]);
export const taxCreditTypeEnum = pgEnum('tax_credit_type', [
  'federal_rd', 'state_rd', 'other'
]);
```

---

## Data Flow & Events

### Event Topics

Treasury publishes to the following Redpanda/Kafka topics:

```typescript
export const TREASURY_EVENTS = {
  // Cash events
  'treasury.cash.position.snapshot': 'Daily position snapshot completed',
  'treasury.cash.movement.recorded': 'Cash movement recorded',
  'treasury.cash.sweep.executed': 'Sweep transfer executed',
  'treasury.cash.balance.low': 'Account below minimum balance',
  'treasury.cash.forecast.generated': 'New forecast generated',
  'treasury.cash.fx.rates.updated': 'FX rates updated',

  // Funding events
  'treasury.funding.round.created': 'New funding round created',
  'treasury.funding.round.opened': 'Round opened for commitments',
  'treasury.funding.round.closed': 'Round closed',
  'treasury.funding.commitment.recorded': 'Investor commitment recorded',
  'treasury.funding.safe.converted': 'SAFE converted to equity',
  'treasury.funding.note.converted': 'Convertible note converted',
  'treasury.funding.vesting.processed': 'Vesting event processed',
  'treasury.funding.report.sent': 'Investor report distributed',

  // P&L events
  'treasury.pnl.consolidation.completed': 'Monthly consolidation completed',
  'treasury.pnl.consolidation.failed': 'Consolidation failed',
  'treasury.pnl.variance.material': 'Material variance detected',
  'treasury.pnl.board_package.approved': 'Board package approved',

  // Tax events
  'treasury.tax.deadline.approaching': 'Tax deadline within 14 days',
  'treasury.tax.deadline.overdue': 'Tax deadline overdue',
  'treasury.tax.payment.recorded': 'Estimated payment recorded',
  'treasury.tax.return.filed': 'Tax return filed',
  'treasury.tax.provision.generated': 'Tax provision calculated',
  'treasury.tax.tp.out_of_range': 'Transfer pricing outside arm\'s length',
} as const;
```

### Data Flow: Venture P&L → Consolidated Board Package

```
@mcv/finance (Tier 4)                 @mcv/treasury (Tier 5)
─────────────────────                  ──────────────────────

BetEdge P&L data ──────┐
SerpSpace P&L data ─────┤              ┌─────────────────────────┐
Full Gain P&L data ─────┤              │  Consolidation Engine   │
MCV Studios P&L data ───┤──── feeds ──→│                         │
Futurestate P&L data ───┤              │  1. Aggregate all 9     │
Venture 6-9 P&L data ──┘              │  2. Identify IC txns    │
                                       │  3. Apply eliminations  │
                                       │  4. Currency translate  │
                                       │  5. Store consolidated  │
                                       └──────────┬──────────────┘
                                                   │
                              ┌─────────────────────┼─────────────────────┐
                              ▼                     ▼                     ▼
                    ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐
                    │ Variance Engine │  │ Segment Reporting│  │ Board Package   │
                    │                 │  │                  │  │ Builder         │
                    │ BvA Analysis    │  │ Per-venture      │  │                 │
                    │ AI Narrative    │  │ breakdown        │  │ Consolidated P&L│
                    │ Material flags  │  │ Industry codes   │  │ Cash position   │
                    └────────┬────────┘  └────────┬─────────┘  │ KPI dashboard   │
                             │                     │           │ PDF generation  │
                             └─────────────────────┴───────────┤                 │
                                                               └────────┬────────┘
                                                                        │
                                                                        ▼
                                                               ┌────────────────┐
                                                               │ @mcv/documents │
                                                               │ PDF Output     │
                                                               └────────┬───────┘
                                                                        │
                                                                        ▼
                                                               Board of Directors
```

### Data Flow: Cash Position Aggregation

```
External Bank APIs                     Treasury Cash Engine
──────────────────                     ────────────────────

Plaid (bank feeds) ─────┐
Mercury API ────────────┤              ┌─────────────────────────┐
SVB API ────────────────┤──── sync ──→│  Cash Position          │
BoA API ────────────────┤  (every 6h) │  Aggregator             │
Wells Fargo API ────────┤              │                         │
Solana RPC ─────────────┘              │  1. Fetch all balances  │
                                       │  2. Convert to USD      │
                                       │  3. Calculate burn rate │
                                       │  4. Project runway      │
                                       │  5. Cache result (5min) │
                                       └──────────┬──────────────┘
                                                   │
                              ┌─────────────────────┼───────────────┐
                              ▼                     ▼               ▼
                    ┌─────────────────┐  ┌──────────────────┐ ┌──────────┐
                    │ Sweep Engine    │  │ Forecast Engine  │ │ Alerts   │
                    │ (nightly)       │  │ (weekly/on-demand│ │          │
                    │                 │  │                  │ │ Low bal  │
                    │ Threshold check │  │ AI-powered       │ │ Runway   │
                    │ Auto-transfer   │  │ 30-365 day       │ │ warning  │
                    └─────────────────┘  └──────────────────┘ └──────────┘
```

---

## Integration Points

### @mcv/finance → Treasury (P&L Data Feed)

```typescript
// Treasury subscribes to finance events for venture P&L data
eventBus.subscribe('finance.pnl.period.closed', async (event) => {
  const { ventureId, period, revenue, expenses, netIncome } = event;

  // Record venture P&L data for consolidation
  await pnlService.recordVenturePnl({
    ventureId,
    period,
    revenue,
    expenses,
    netIncome,
  });

  // Check if all ventures have closed the period
  const closedCount = await pnlService.getClosedVentureCount(period);
  if (closedCount >= 9) {
    // Auto-trigger consolidation
    await pnlService.runConsolidation({
      period,
      periodType: 'monthly',
      consolidationMethod: 'full',
    });
  }
});
```

### @mcv/connectors → Treasury (Bank Feeds)

```typescript
// Bank balance sync via Plaid integration
export async function syncBankFeeds(): Promise<SyncResult> {
  const accounts = await db
    .select()
    .from(treasuryBankAccounts)
    .where(
      and(
        eq(treasuryBankAccounts.status, 'active'),
        isNotNull(treasuryBankAccounts.plaidAccountId)
      )
    );

  const results: SyncResult = { synced: 0, failed: 0, errors: [] };

  for (const account of accounts) {
    try {
      const plaidBalance = await plaidClient.getBalance(account.plaidItemId!);
      const matchingAccount = plaidBalance.accounts.find(
        a => a.account_id === account.plaidAccountId
      );

      if (matchingAccount) {
        await db
          .update(treasuryBankAccounts)
          .set({
            currentBalance: matchingAccount.balances.current.toString(),
            availableBalance: matchingAccount.balances.available?.toString(),
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(treasuryBankAccounts.id, account.id));

        results.synced++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push({ accountId: account.id, error: error.message });
    }
  }

  return results;
}
```

### @mcv/web3-core → Treasury (Crypto Treasury)

```typescript
// Crypto wallet balance integration
eventBus.subscribe('web3.wallet.balance.updated', async (event) => {
  const { walletAddress, balanceSol, balanceUsd } = event;

  // Find the treasury bank account linked to this wallet
  const account = await db
    .select()
    .from(treasuryBankAccounts)
    .where(
      and(
        eq(treasuryBankAccounts.accountType, 'crypto_wallet'),
        sql`${treasuryBankAccounts.metadata}->>'walletAddress' = ${walletAddress}`
      )
    )
    .then(rows => rows[0]);

  if (account) {
    await db
      .update(treasuryBankAccounts)
      .set({
        currentBalance: balanceUsd.toString(),
        lastSyncedAt: new Date(),
        metadata: {
          ...account.metadata,
          solBalance: balanceSol,
          walletAddress,
        },
        updatedAt: new Date(),
      })
      .where(eq(treasuryBankAccounts.id, account.id));
  }
});
```

### @mcv/portfolio → Treasury (Venture Financials)

```typescript
// Portfolio reads treasury data for venture financial views
export async function getVentureFinancialSummary(
  ventureId: string
): Promise<VentureFinancialSummary> {
  const [cashPosition, fundingStatus, pnlData] = await Promise.all([
    cashService.getVenturePosition(ventureId),
    fundingService.listRounds({ ventureId }),
    pnlService.getSegmentResults({
      ventureId,
      period: getCurrentPeriod(),
    }),
  ]);

  return {
    ventureId,
    cash: {
      totalBalance: cashPosition.totalBalance,
      burnRate: cashPosition.burnRate,
      runwayDays: cashPosition.runwayDays,
    },
    funding: {
      totalRaised: fundingStatus.reduce(
        (sum, r) => sum + Number(r.raisedAmount), 0
      ),
      activeRounds: fundingStatus.filter(r => r.status === 'active'),
      lastRoundType: fundingStatus[0]?.roundType,
    },
    pnl: {
      revenue: pnlData[0]?.revenue ?? '0',
      operatingIncome: pnlData[0]?.operatingIncome ?? '0',
      netIncome: pnlData[0]?.netIncome ?? '0',
    },
  };
}
```

---

## Performance Architecture

### Caching Layer

```
┌─────────────────────────────────────────────────────────────┐
│                     REDIS CACHE LAYER                        │
│                                                              │
│  ┌───────────────────────────┐  TTL: 5 minutes              │
│  │ Consolidated Cash Position │  Key: treasury:position      │
│  │ Per-Venture Positions      │  Hit rate: ~95%              │
│  └───────────────────────────┘                               │
│                                                              │
│  ┌───────────────────────────┐  TTL: 10 minutes             │
│  │ Cap Table Views            │  Key: treasury:cap:{id}      │
│  │ Investor Holdings          │  Hit rate: ~90%              │
│  └───────────────────────────┘                               │
│                                                              │
│  ┌───────────────────────────┐  TTL: 1 hour                 │
│  │ Latest Forecasts           │  Key: treasury:forecast:{id} │
│  │ FX Rates                   │  Hit rate: ~98%              │
│  │ Tax Calendar (upcoming)    │                              │
│  └───────────────────────────┘                               │
│                                                              │
│  ┌───────────────────────────┐  TTL: 24 hours               │
│  │ Closed Period Consolidation│  Key: treasury:consol:{prd}  │
│  │ Historical Snapshots       │  Immutable after close       │
│  └───────────────────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

### Query Optimization

```sql
-- Materialized view for consolidated position (refreshed every 5 min)
CREATE MATERIALIZED VIEW treasury_consolidated_position_mv AS
SELECT
  ba.venture_id,
  ba.currency,
  SUM(ba.current_balance) as total_balance,
  COUNT(*) as account_count
FROM treasury_bank_accounts ba
WHERE ba.status = 'active'
GROUP BY ba.venture_id, ba.currency;

CREATE UNIQUE INDEX ON treasury_consolidated_position_mv (venture_id, currency);

-- Partial indexes for common queries
CREATE INDEX idx_movements_recent ON treasury_cash_movements(transaction_date DESC)
  WHERE status = 'completed'
  AND transaction_date > NOW() - INTERVAL '90 days';

CREATE INDEX idx_calendar_upcoming ON treasury_tax_calendar_events(due_date)
  WHERE status IN ('upcoming', 'in_progress')
  AND due_date > NOW();
```

### Connection Pooling

```typescript
// Treasury uses a dedicated connection pool for financial operations
const treasuryPool = {
  connectionString: process.env.SUPABASE_DATABASE_URL,
  max: 20,              // Max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // Separate pool from main app to prevent resource contention
  application_name: 'treasury_service',
};
```

---

## Scalability

### Horizontal Scaling Strategy

```
Current: Single PostgreSQL instance (Supabase Pro)
─────────────────────────────────────────────────

  9 ventures × 62 tables = manageable on single instance
  Daily positions: ~30 rows/day (3 accounts avg × 9 ventures + consolidated)
  Cash movements: ~200/day across all ventures
  Consolidation: 1 run/month, ~60 seconds

Growth Path: Read Replicas + Partitioning
──────────────────────────────────────────

  Phase 1: Read replicas for dashboard queries
  Phase 2: Partition cash_positions and cash_movements by year
  Phase 3: Partition by venture_id if venture count exceeds 20

Table Partitioning (when needed):
  treasury_cash_positions → partition by RANGE (snapshot_date)
  treasury_cash_movements → partition by RANGE (transaction_date)
  treasury_tax_audit_trail → partition by RANGE (created_at)
```

### Event Processing Scale

```
Redpanda Topic Partitioning:
  treasury.cash.*     → 3 partitions (keyed by venture_id)
  treasury.funding.*  → 1 partition (low volume)
  treasury.pnl.*      → 1 partition (low volume, batch)
  treasury.tax.*      → 1 partition (low volume)

Consumer Groups:
  treasury-dashboard   → Real-time position updates
  treasury-alerts      → Low-balance and deadline notifications
  treasury-analytics   → Historical analysis and AI training
  agentic-os-cfo      → CFO Agent consumption
```

---

## Error Handling

### Error Codes

```typescript
export enum TreasuryErrorCode {
  // Cash errors (CASH_*)
  TREASURY_VENTURE_NOT_FOUND = 'TREASURY_VENTURE_NOT_FOUND',
  TREASURY_BANK_ACCOUNT_NOT_FOUND = 'TREASURY_BANK_ACCOUNT_NOT_FOUND',
  TREASURY_INSUFFICIENT_BALANCE = 'TREASURY_INSUFFICIENT_BALANCE',
  TREASURY_SWEEP_BELOW_MINIMUM = 'TREASURY_SWEEP_BELOW_MINIMUM',
  TREASURY_DUPLICATE_MOVEMENT = 'TREASURY_DUPLICATE_MOVEMENT',
  TREASURY_FORECAST_OVERLAP = 'TREASURY_FORECAST_OVERLAP',

  // Funding errors (FUNDING_*)
  TREASURY_ROUND_NOT_ACTIVE = 'TREASURY_ROUND_NOT_ACTIVE',
  TREASURY_ROUND_OVERSUBSCRIBED = 'TREASURY_ROUND_OVERSUBSCRIBED',
  TREASURY_INVESTOR_KYC_REQUIRED = 'TREASURY_INVESTOR_KYC_REQUIRED',
  TREASURY_INVESTOR_NOT_ACCREDITED = 'TREASURY_INVESTOR_NOT_ACCREDITED',
  TREASURY_SAFE_ALREADY_CONVERTED = 'TREASURY_SAFE_ALREADY_CONVERTED',
  TREASURY_NOTE_MATURED = 'TREASURY_NOTE_MATURED',

  // P&L errors (PNL_*)
  TREASURY_CONSOLIDATION_IN_PROGRESS = 'TREASURY_CONSOLIDATION_IN_PROGRESS',
  TREASURY_PERIOD_ALREADY_CLOSED = 'TREASURY_PERIOD_ALREADY_CLOSED',
  TREASURY_ELIMINATION_MISMATCH = 'TREASURY_ELIMINATION_MISMATCH',

  // Tax errors (TAX_*)
  TREASURY_TAX_ENTITY_NOT_FOUND = 'TREASURY_TAX_ENTITY_NOT_FOUND',
  TREASURY_TAX_PAYMENT_OVERDUE = 'TREASURY_TAX_PAYMENT_OVERDUE',
  TREASURY_TP_OUT_OF_RANGE = 'TREASURY_TP_OUT_OF_RANGE',
  TREASURY_PROVISION_LOCKED = 'TREASURY_PROVISION_LOCKED',

  // General errors
  TREASURY_UNAUTHORIZED = 'TREASURY_UNAUTHORIZED',
  TREASURY_RATE_LIMIT = 'TREASURY_RATE_LIMIT',
}

export class TreasuryError extends Error {
  constructor(
    public code: TreasuryErrorCode,
    message?: string,
    public statusCode: number = 400,
    public metadata?: Record<string, unknown>
  ) {
    super(message ?? code);
    this.name = 'TreasuryError';
  }
}
```

### Transaction Rollback Strategy

```typescript
// All multi-table operations use database transactions
// with automatic rollback on any failure.

async function executeWithRollback<T>(
  operation: (tx: Transaction) => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await db.transaction(async (tx) => {
      const result = await operation(tx);

      // Verify integrity constraints before commit
      await verifyFinancialIntegrity(tx);

      return result;
    });
  } catch (error) {
    // Transaction automatically rolled back
    logger.error(`Treasury operation failed: ${context}`, {
      error: error.message,
      code: error instanceof TreasuryError ? error.code : 'UNKNOWN',
    });

    // Record in audit trail
    await auditService.recordFailure({
      operation: context,
      error: error.message,
      timestamp: new Date(),
    });

    throw error;
  }
}
```

---

## Observability

### Metrics

```typescript
// Treasury-specific metrics exported to monitoring
export const TREASURY_METRICS = {
  // Cash metrics
  'treasury.cash.total_balance': 'gauge',           // Total consolidated cash
  'treasury.cash.burn_rate_monthly': 'gauge',        // Monthly burn rate
  'treasury.cash.runway_days': 'gauge',              // Days of runway
  'treasury.cash.sync_duration_ms': 'histogram',     // Bank sync latency
  'treasury.cash.sweep_count_daily': 'counter',      // Sweeps executed per day
  'treasury.cash.forecast_accuracy': 'gauge',        // Forecast vs actual accuracy

  // Funding metrics
  'treasury.funding.active_rounds': 'gauge',         // Open funding rounds
  'treasury.funding.total_raised_ytd': 'gauge',      // Year-to-date capital raised
  'treasury.funding.pending_conversions': 'gauge',   // SAFEs/notes pending conversion

  // P&L metrics
  'treasury.pnl.consolidation_duration_ms': 'histogram', // Consolidation time
  'treasury.pnl.eliminations_count': 'gauge',        // IC eliminations applied
  'treasury.pnl.material_variances': 'gauge',        // Material variance count

  // Tax metrics
  'treasury.tax.upcoming_deadlines': 'gauge',        // Deadlines in next 30 days
  'treasury.tax.overdue_payments': 'gauge',           // Overdue payment count
  'treasury.tax.effective_tax_rate': 'gauge',         // Current effective rate
};
```

### Structured Logging

```typescript
// All treasury operations use structured logging
const logger = createLogger({
  service: 'treasury',
  defaultMeta: {
    package: '@mcv/treasury',
    tier: 5,
    classification: 'mcv-only',
  },
});

// Example: consolidation logging
logger.info('Consolidation started', {
  period: '2026-01',
  ventureCount: 9,
  method: 'full',
  runId: run.id,
});

logger.info('Eliminations applied', {
  period: '2026-01',
  eliminationCount: 12,
  totalAmount: '70000.0000',
  types: { revenue: 6, cogs: 4, payable: 2 },
});

logger.info('Consolidation completed', {
  period: '2026-01',
  duration_ms: 42500,
  netIncome: '230000.0000',
  runId: run.id,
});
```

### Health Check Dashboard

```typescript
export interface TreasuryHealthDashboard {
  overall: 'healthy' | 'degraded' | 'critical';
  components: {
    database: { status: string; latency_ms: number };
    redis: { status: string; hitRate: number };
    plaid: { status: string; lastSync: Date };
    events: { status: string; lag: number };
  };
  treasury: {
    lastPositionSnapshot: Date;
    lastConsolidation: Date;
    overduePayments: number;
    upcomingDeadlines: number;
    activeFundingRounds: number;
    pendingConsolidations: number;
  };
}
```

---

## Security Architecture

### Encryption Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   ENCRYPTION LAYERS                          │
│                                                              │
│  Layer 1: Transport (TLS 1.3)                               │
│  ├── All API calls encrypted in transit                     │
│  ├── Webhook deliveries signed with HMAC-SHA256             │
│  └── Database connections via SSL                           │
│                                                              │
│  Layer 2: Storage (AES-256-GCM)                             │
│  ├── Federal EIN: tax_entities.ein                          │
│  ├── State Tax IDs: tax_entities.state_id                   │
│  ├── Bank Routing: bank_accounts.bank_routing_number        │
│  ├── Investor Tax IDs: investors.tax_id                     │
│  ├── Investor Bank: investors.bank_details                  │
│  ├── ACH Routing: ach_transactions.recipient_routing_number │
│  └── SWIFT Codes: wire_transfers.beneficiary_swift_code     │
│                                                              │
│  Layer 3: Application                                        │
│  ├── RLS policies on all 62 tables                          │
│  ├── Role-based access (treasury:admin, treasury:viewer)    │
│  ├── Dual approval for high-value operations                │
│  └── Investor portal isolation                              │
│                                                              │
│  Key Management:                                             │
│  ├── Rotation: every 90 days                                │
│  ├── Old keys retained for decryption of historical data    │
│  └── Master key stored in Supabase Vault                    │
└─────────────────────────────────────────────────────────────┘
```

### Request Authentication Flow

```
Client Request
     │
     ▼
┌──────────────┐
│ TLS 1.3      │  Transport encryption
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ @mcv/identity│  JWT validation + session check
│ Auth Layer   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Role Check   │  treasury:admin | treasury:viewer
│ Middleware   │  investor:portal (for investor endpoints)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Dual Approval│  For operations >$25K:
│ Check        │  wire, tax payment, round close
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ RLS Context  │  Set app.current_venture_id
│ Setup        │  Set app.current_user_id
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Treasury     │  Business logic execution
│ Service      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Audit Log    │  Record action + actor + timestamp
└──────────────┘
```

### Audit Trail Implementation

```typescript
// Automatic audit trigger on all financial tables
CREATE OR REPLACE FUNCTION treasury_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO treasury_tax_audit_trail (
    tax_entity_id,
    action,
    actor_id,
    resource_type,
    resource_id,
    previous_value,
    new_value,
    ip_address,
    created_at
  ) VALUES (
    COALESCE(NEW.tax_entity_id, OLD.tax_entity_id),
    TG_OP,
    current_setting('app.current_user_id', true)::uuid,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
    current_setting('app.client_ip', true),
    NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Applied to all financial mutation tables
CREATE TRIGGER audit_cash_movements
  AFTER INSERT OR UPDATE OR DELETE ON treasury_cash_movements
  FOR EACH ROW EXECUTE FUNCTION treasury_audit_trigger();

CREATE TRIGGER audit_wire_transfers
  AFTER INSERT OR UPDATE OR DELETE ON treasury_wire_transfers
  FOR EACH ROW EXECUTE FUNCTION treasury_audit_trigger();

-- ... (applied to all 62 tables)
```

---

*@mcv/treasury — Treasury Management Domain*
