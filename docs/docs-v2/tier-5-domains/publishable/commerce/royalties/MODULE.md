# @mcv/commerce/royalties — Creator Royalties & Revenue Sharing

**Parent Package:** @mcv/commerce
**Tier:** 5 (Domain)
**Classification:** PUBLISHABLE (Phase 2: Q3 2026)
**Last Updated:** April 5, 2026
**Spec Reference:** `docs/superpowers/specs/2026-04-05-commerce-financial-os-design.md` (Section 8)

---

## Purpose

The `royalties` module provides **automatic, transparent, on-chain-verifiable royalty splits** for creator content across the MCV ecosystem. Every sale, resale, stream, usage, or derivative work triggers royalty distribution to creators and collaborators.

This is a first-class commerce primitive — not a bolt-on. Creator economics are foundational to mcv.gg (creator subscriptions), WarForge (user-generated content), and any venture with a marketplace.

---

## Dependencies

| Package | Why |
|---------|-----|
| `@mcv/shared/ledger` | Journal entries for royalty distributions |
| `@mcv/payments` | Split payment execution across rails |
| `@mcv/commerce/payments` | Transaction hooks for sale/resale events |
| `@mcv/identity` | Creator/collaborator identity resolution |

---

## Exports

```typescript
export {
  // Royalty configuration
  createRoyaltyAgreement,       // Define royalty terms for a product
  updateRoyaltyAgreement,       // Modify splits (only for unsold products)
  getRoyaltyAgreement,          // Get agreement details
  listRoyaltyAgreements,        // List agreements for a creator/venture

  // Royalty splits
  addCollaborator,              // Add collaborator with percentage split
  removeCollaborator,           // Remove collaborator
  updateSplits,                 // Rebalance split percentages

  // Distribution
  calculateRoyalties,           // Calculate royalty amounts for a transaction
  distributeRoyalties,          // Execute royalty payouts
  batchDistribute,              // Process accumulated royalties in batch
  getDistributionHistory,       // History of distributions for a creator

  // Revenue sharing programs
  createRevenueShareProgram,    // Affiliate/referral/reseller program
  joinProgram,                  // Partner joins program
  trackAttribution,             // Record referral attribution
  calculateCommission,          // Compute commission for partner

  // Creator dashboard data
  getCreatorEarnings,           // Total earnings, by product, by period
  getCreatorPayoutSchedule,     // Upcoming payouts
  getRoyaltyAnalytics,          // Stream counts, resale volume, derivatives

  // On-chain enforcement
  registerTransferHook,         // Deploy Token-2022 Transfer Hook for royalty enforcement
  validateRoyaltyPayment,       // Verify royalty paid before token transfer
}

export type {
  CreatorRoyaltyConfig,
  RoyaltySplit,
  RoyaltyType,
  VestingSchedule,
  DerivativePolicy,
  RevenueSharingProgram,
  CommissionStructure,
  AffiliatePartner,
  RoyaltyDistribution,
}
```

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `royalty_agreements` | Royalty terms per product |
| `royalty_splits` | Collaborator splits per agreement |
| `royalty_distributions` | Distribution history (links to ledger entries) |
| `revenue_share_programs` | Affiliate/referral program definitions |
| `affiliate_partners` | Partners enrolled in programs |
| `affiliate_attributions` | Referral tracking and attribution |
| `affiliate_commissions` | Commission records and payouts |

---

## Royalty Flow

```
Sale event (primary or resale)
        |
        v
calculateRoyalties()
  - Look up royalty agreement for product
  - Calculate each collaborator's share
  - Factor in resale royalty rate if secondary sale
        |
        v
distributeRoyalties()
  - Create SplitPaymentRequest via @mcv/payments
  - Each split → JournalEntry in @mcv/shared/ledger
  - Creator payout accumulated or sent immediately (per config)
        |
        v
On-chain enforcement (if tokenized)
  - Token-2022 Transfer Hook validates royalty payment
  - Transfer blocked if royalty not paid
  - Royalty enforced at protocol level
```

---

## Event Emissions

```typescript
'royalty.agreement.created'
'royalty.distribution.calculated'
'royalty.distribution.paid'
'royalty.payout.scheduled'
'royalty.payout.completed'
'affiliate.partner.joined'
'affiliate.commission.earned'
'affiliate.commission.paid'
```
