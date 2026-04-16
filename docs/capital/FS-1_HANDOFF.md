# FS-1 Handoff — Futurestate bills/pay payout wiring

**Target repo**: `C:\Users\moust\Documents\GitHub\Futurestate`
**Branch to create**: `capital-bills-payout-online-2026-04-16`
**Depends on**: `@mcv/capital-sdk@^0.2.0` (shipped 2026-04-16, PR #29 mcv-one-desktop)
**Dependency status**: live Supabase tables seeded (8 legal entities, 10 treasuries, 7 royalty graphs, 22 distribution configs across 7 ventures)

---

## The TODO being closed

[`apps/admin/src/app/api/bills/[id]/pay/route.ts:26`](../../apps/admin/src/app/api/bills/[id]/pay/route.ts) currently has:

```ts
// TODO(MCV): trigger actual payout via Stripe Connect transfer or treasury wallet.
```

This is the one line that blocks capital from flowing end-to-end in Futurestate. All downstream infrastructure is in place: Stripe Connect accounts onboarded, webhook handler with idempotency shipped, `processDistributions()` already works for YieldPayouts.

## What FS-1 ships

1. **`apps/investor/src/lib/mcv/payment-router.ts`** — singleton wrapper around `@mcv/payments-sdk` PaymentRouter (resolves per-venture processor).
2. **`apps/investor/src/lib/mcv/capital-adapter.ts`** — instantiates `createVentureAdapter({ ventureId: 'futurestate-realestate', publisher })` from `@mcv/capital-sdk`. Since Futurestate uses Prisma (not Supabase), publisher implementation uses Prisma `notification` table + optional Fabric (see VENTURE_ADAPTER.md "Prisma venture" recipe).
3. **`apps/investor/src/lib/stripe/payBill.ts`** — `payBill({ billId, actorId })` helper:
   - Atomic `updateMany({ where: { id, status: { not: 'PAID' } }, data: { status: 'PROCESSING', stripeIdempotencyKey: 'bill_${billId}_v1' } })` — zero rows returned = already paid or racing.
   - Call `PaymentRouter.processPayment({ method: 'stripe', ventureId: 'futurestate-realestate', reference: billId, ... })`.
   - On success: stamp `stripeTransferId`, emit `capital.bill.paid`. Don't flip to `PAID` — webhook does it.
   - On failure: emit `capital.bill.failed`, status stays PROCESSING for replay.
4. **Modify `apps/admin/src/app/api/bills/[id]/pay/route.ts`** — replace TODO block (lines 26-35) with `await payBill({ billId, actorId })`.
5. **Modify `apps/investor/src/lib/stripe/utils.ts`** — thread optional `idempotencyKey` through `processDistributions()` (backwards-compatible, defaults to `yield_${yieldPayoutId}_${holdingId}_v1`).
6. **Modify `apps/investor/src/app/api/payments/webhooks/stripe/route.ts`** — in `handleTransferCreated`/`handlePayoutPaid`/`handlePayoutFailed`, branch on `transfer_group` prefix: `bill_*` → update VendorBill (PROCESSING → PAID on payout.paid, → FAILED with reason on payout.failed); `yield_*` → existing logic.
7. **Prisma schema additions** in `packages/database/prisma/schema.prisma`:
   - `VendorBill.stripeTransferId String?`
   - `VendorBill.stripeIdempotencyKey String? @unique`
   - `BillStatus` enum: add `PROCESSING`, `FAILED`, `REVERSED`.

## Reuse (don't reimplement)

- `processDistributions()` at [`apps/investor/src/lib/stripe/utils.ts:201-240`](../../../Futurestate/apps/investor/src/lib/stripe/utils.ts#L201-L240) — thread idempotency through, don't copy-paste Stripe calls.
- Webhook idempotency via `StripeWebhookEvent` table at [`apps/investor/src/app/api/payments/webhooks/stripe/route.ts`](../../../Futurestate/apps/investor/src/app/api/payments/webhooks/stripe/route.ts) — extend, don't duplicate.
- Existing Stripe client singleton in `apps/investor/src/lib/stripe/utils.ts`.
- `logAuditEvent` in `apps/admin/src/lib/audit`.

## Tests to ship

- Unit: `payBill` idempotency (second call with same key → no new transfer, updated status only).
- Unit: `payBill` failure path leaves status PROCESSING, emits `capital.bill.failed`.
- Integration: admin route → PaymentRouter mock → webhook replay → DB transitions PENDING → PROCESSING → PAID.
- Contract test: PaymentRouter signature against pinned `@mcv/payments-sdk` version.

## Demo script (Stripe test mode)

1. Seed: test user + `VendorBill` $1 CAD, payee has `stripeConnectAccountId`.
2. `POST /api/bills/{id}/pay` as admin.
3. Assert: bill `PENDING → PROCESSING`, `stripeIdempotencyKey` stamped, Stripe dashboard shows `tr_...` with `transfer_group=bill_<id>`, `capital.bill.paid` event in Prisma `notification` table.
4. Re-POST same endpoint → 200, no new transfer (idempotency proven).
5. `stripe trigger payout.paid metadata transfer_group=bill_<id>` → bill flips to `PAID`.

## Feature flag

Gate the whole path behind `CAPITAL_PAYOUTS_ENABLED=false` in prod; flip to `true` only after 24h of staging validation with the demo script passing.

## Open question (answer during execution)

- **Vendor identity for capital-call-derived bills**: property SPV vs platform treasury vs sponsor/manager? Per the luminous-mapping-globe plan this is configurable (`PayeeStrategy` enum), but the first implementation in FS-1 should pick ONE default. Recommend `PROPERTY_SPV` (matches existing `Vendor` row per property). Revisit when FS-2 (BillPayeeResolver) ships.

## Commit sequence

- One PR, split into reviewable commits if it gets large:
  1. Prisma schema additions + migration (reversible).
  2. Payment-router wrapper + capital-adapter (no behavior change yet).
  3. `payBill.ts` helper + tests.
  4. Wire admin route + extend webhook.
  5. Deploy behind feature flag.

## Parallel-session orchestration note

If firing this as a separate Claude Code session:
- Working directory: `C:\Users\moust\Documents\GitHub\Futurestate`
- Starting prompt: "Implement FS-1 per [docs/capital/FS-1_HANDOFF.md in mcv-one-desktop]. All dependencies are live. Ship it."
- The session is self-contained; it imports from `@mcv/capital-sdk@^0.2.0` which is already published on the mcv-one-desktop workspace.
- Do not modify mcv-one-desktop files from within that session.
