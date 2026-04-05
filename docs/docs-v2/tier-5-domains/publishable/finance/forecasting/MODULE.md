# @mcv/finance/forecasting — Financial Forecasting & Intelligence

**Parent Package:** @mcv/finance
**Tier:** 5 (Domain)
**Classification:** PUBLISHABLE (Phase 3: Q4 2026)
**Last Updated:** April 5, 2026
**Spec Reference:** `docs/superpowers/specs/2026-04-05-commerce-financial-os-design.md` (Section 14)

---

## Purpose

The `forecasting` module provides **AI-powered financial projections** using historical ledger data, subscription metrics, and external signals. It projects revenue, expenses, cash flow, runway, churn, and customer growth across conservative/base/optimistic scenarios with confidence intervals.

---

## Dependencies

| Package | Why |
|---------|-----|
| `@mcv/shared/ledger` | Historical financial data |
| `@mcv/finance/reporting` | Computed metrics (MRR, ARR, churn) |
| `@mcv/intelligence/gateway` | Claude API for AI-powered analysis |
| `@mcv/shared/calculations` | Precision-safe projections |

---

## Exports

```typescript
export {
  generateForecast,             // Create multi-scenario projection
  getForecastHistory,           // Historical forecast accuracy
  getRunwayProjection,          // Months until cash runs out
  getChurnPrediction,           // Per-customer churn probability
  getRevenueDrivers,            // What's driving revenue up/down
  getRiskAssessment,            // Financial risks and mitigations
  compareActualToForecast,      // Forecast accuracy tracking
}

export type {
  ForecastRequest,
  ForecastResult,
  ForecastDataPoint,
  ForecastMetric,
  ForecastRisk,
  RunwayProjection,
}
```

---

## Forecast Metrics

| Metric | Method | Inputs |
|--------|--------|--------|
| Revenue | Time series + seasonality | Historical MRR, growth rate, churn |
| MRR | Cohort-based expansion/contraction | Subscription events, upgrades/downgrades |
| Expenses | Trend extrapolation | Historical expense categories |
| Cash Flow | Revenue - Expenses + adjustments | Operating, investing, financing flows |
| Runway | Cash / Burn Rate | Current cash position, burn trend |
| Churn | Survival analysis | Customer tenure, engagement signals |
| Customer Count | Growth model | Acquisition rate, churn rate |
| Processing Costs | Volume-weighted trend | Transaction volume, fee optimization |

---

## Event Emissions

```typescript
'forecast.generated'
'forecast.runway.warning'         // Runway below 6 months
'forecast.runway.critical'        // Runway below 3 months
'forecast.anomaly.detected'       // Actual deviates >20% from forecast
```
