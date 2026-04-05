# @mcv/finance/consolidation — Multi-Entity Consolidation

**Parent Package:** @mcv/finance
**Tier:** 5 (Domain)
**Classification:** PUBLISHABLE (Phase 3: Q4 2026)
**Last Updated:** April 5, 2026
**Spec Reference:** `docs/superpowers/specs/2026-04-05-commerce-financial-os-design.md` (Section 15)

---

## Purpose

The `consolidation` module produces **combined financial statements** for EdgeIQ Holdings across all ventures, with automatic inter-venture elimination entries. Essential for corporate reporting, fundraising deck financials, and tax compliance.

Each venture maintains its own ledger (via `@mcv/shared/ledger`). This module reads all venture ledgers, identifies inter-venture transactions (platform fees, shared services, internal transfers), creates elimination entries, and produces consolidated Income Statement, Balance Sheet, and Cash Flow Statement.

---

## Dependencies

| Package | Why |
|---------|-----|
| `@mcv/shared/ledger` | Read all venture ledgers |
| `@mcv/finance/reporting` | Individual venture financial statements |
| `@mcv/finance/accounting` | Chart of accounts mapping |
| `@mcv/shared/calculations` | FX conversion for multi-currency ventures |

---

## Exports

```typescript
export {
  generateConsolidatedReport,     // Full consolidated financial statement
  identifyInterventureTransactions, // Find transactions between ventures
  generateEliminations,           // Create elimination entries
  getConsolidationHistory,        // Past consolidated reports
  reconcileInterventure,          // Verify intercompany balances match
  getMinorityInterest,            // External investor shares
}

export type {
  ConsolidatedReport,
  EliminationEntry,
  InterventureTransaction,
  MinorityInterest,
}
```

---

## Elimination Categories

| Category | Example | Elimination |
|----------|---------|-------------|
| `intercompany_revenue` | Futurestate pays MCV Platform 1% fee | Remove revenue + expense |
| `intercompany_payable` | BetEdge owes ARQ Labs for AI service | Remove AR + AP |
| `intercompany_investment` | MCV Platform holds equity in ventures | Remove investment + equity |
| `unrealized_profit` | Internal service at markup | Remove unrealized margin |
| `platform_fee_internal` | Platform fees between ventures | Remove both sides |
