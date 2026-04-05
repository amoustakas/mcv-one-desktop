# @mcv/payments/fraud-detection — Fraud Detection & Prevention

**Parent Package:** @mcv/payments
**Tier:** 3 (Connectors)
**Classification:** PUBLISHABLE (Phase 2: Q3 2026)
**Last Updated:** April 5, 2026
**Spec Reference:** `docs/superpowers/specs/2026-04-05-commerce-financial-os-design.md` (Section 12)

---

## Purpose

The `fraud-detection` module scores every transaction for fraud risk before it reaches a payment processor. It combines velocity checks, behavioral analysis, device fingerprinting, geographic signals, and configurable rules to produce a risk score (0-100) and a decision (allow/review/block).

---

## Dependencies

| Package | Why |
|---------|-----|
| `@mcv/payments` | Pre-payment hook for risk scoring |
| `@mcv/identity` | Account age, KYC status, history |
| `@mcv/kernel/events` | Real-time alerting on high-risk transactions |
| `@mcv/intelligence/gateway` | ML model inference for pattern detection |

---

## Exports

```typescript
export {
  scoreTransaction,             // Calculate risk score for a payment request
  evaluateRules,                // Run custom fraud rules
  getTransactionRisk,           // Get risk assessment for past transaction
  createFraudRule,              // Add custom rule per venture
  updateFraudRule,              // Modify rule
  listFraudRules,               // List active rules
  getFraudDashboard,            // Real-time fraud metrics
  reportFraud,                  // Manual fraud report
  getVelocityReport,            // Transaction velocity analysis
}

export type {
  FraudCheckResult,
  FraudSignal,
  FraudSignalType,
  FraudRule,
  VelocityMetrics,
}
```

---

## Fraud Signals

| Signal | Severity | Score Impact | Description |
|--------|----------|-------------|-------------|
| `velocity_amount` | High | +30 | >$5K spend in 1 hour |
| `velocity_count` | High | +25 | >10 transactions in 10 minutes |
| `geo_mismatch` | Medium | +20 | Billing country != IP country |
| `device_fingerprint` | Medium | +15 | New/suspicious device |
| `card_testing` | Critical | +40 | Sequential small amounts |
| `account_age` | Low | +10 | Account < 24 hours old |
| `unusual_amount` | Medium | +15 | >3 std dev from user average |
| `repeated_decline` | High | +25 | >3 declines in 1 hour |

Risk thresholds: 0-30 = allow, 31-70 = review, 71-100 = block.

---

## Prevention Measures

- **3D Secure 2.0** — Triggered for risk score > 40 (shifts liability to issuer)
- **Address Verification (AVS)** — Required on all card transactions
- **CVV/CVC** — Always required, never stored
- **IP Geolocation** — Compared to billing address
- **Device Fingerprinting** — Tracks repeat fraud devices
- **Velocity Limits** — Configurable per venture
