# @mcv/commerce/escrow — Escrow Service

**Parent Package:** @mcv/commerce
**Tier:** 5 (Domain)
**Classification:** PUBLISHABLE (Phase 2: Q3 2026)
**Last Updated:** April 5, 2026
**Spec Reference:** `docs/superpowers/specs/2026-04-05-commerce-financial-os-design.md` (Section 9)

---

## Purpose

The `escrow` module provides **trusted intermediary services** for marketplace transactions, milestone-based service payments, and high-value exchanges. Funds are held in escrow ledger accounts (a liability) until release conditions are met — buyer confirmation, milestone completion, time-based auto-release, or third-party verification.

---

## Dependencies

| Package | Why |
|---------|-----|
| `@mcv/shared/ledger` | Escrow holding accounts and journal entries |
| `@mcv/payments` | Funding and release via payment router |
| `@mcv/identity` | Buyer/seller identity and KYC verification |
| `@mcv/shared/workflows` | Approval chains for milestone verification |

---

## Exports

```typescript
export {
  createEscrowAgreement,        // Define escrow terms between buyer and seller
  fundEscrow,                   // Buyer deposits funds into escrow account
  submitMilestone,              // Seller submits milestone evidence
  approveMilestone,             // Buyer approves milestone → partial release
  rejectMilestone,              // Buyer rejects milestone → revision needed
  releaseEscrow,                // Full release to seller
  disputeEscrow,                // Initiate dispute
  resolveDispute,               // Platform arbitration decision
  cancelEscrow,                 // Cancel and refund buyer
  getEscrowAgreement,           // Get agreement details
  listEscrowAgreements,         // List active/completed escrows
}

export type {
  EscrowAgreement,
  EscrowMilestone,
  EscrowConfig,
  EscrowReleaseCondition,
  EscrowStatus,
}
```

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `escrow_agreements` | Agreement terms, parties, amounts |
| `escrow_milestones` | Milestone definitions and status |
| `escrow_milestone_evidence` | Proof of completion uploads |
| `escrow_disputes` | Dispute records and resolution |
| `escrow_releases` | Release history (links to ledger entries) |

---

## Escrow Ledger Flow

```
Fund escrow:
  DR: Escrow Holding Account (1095)  $5,000
  CR: Cash (buyer's payment)         $5,000

Release milestone (50%):
  DR: Escrow Fee Expense             $125  (2.5% platform fee)
  DR: Seller Payout                  $2,375
  CR: Escrow Holding Account         $2,500

Dispute → full refund:
  DR: Cash (buyer refund)            $2,500
  CR: Escrow Holding Account         $2,500
```
