# VentureAdapter Integration Guide

Introduced in `@mcv/capital-sdk@0.2.0`. Defines the single cross-venture event contract every EdgeIQ venture emits against when capital moves.

This is the "M" in a venture's MCV wiring — the place where venture-local state transitions become protocol-level events consumable by Capital Ecosystem Bus, Fabric, notifications, analytics, and third-party subscribers.

---

## Why a VentureAdapter

- **One contract for all ventures.** Futurestate, BetEdge, WarForge, MCV.gg, ARQ Labs, EdgeIQ Markets, and MCV Platform all emit the same `capital.*` topics with the same envelope — even though their underlying DBs (Prisma, Supabase, direct Postgres) and rails (Stripe, Plaid, SPL, on-chain) differ.
- **Fire-and-forget.** Publish failures never block the caller's primary transaction. Money movement is the product; eventing is telemetry.
- **Publisher-agnostic.** Ventures choose their sink — Supabase `notifications`, Fabric HTTP, console, or any compose thereof — without the adapter knowing.
- **Typed.** Zod-validated discriminated union of 18 topics (see `CAPITAL_EVENT_TOPICS`).

## Topics shipped in v0.2.0

| Group | Topics |
|---|---|
| Capital call | `capital.call.created`, `capital.call.published`, `capital.call.funded`, `capital.call.closed`, `capital.call.defaulted` |
| Commitment | `capital.commitment.created`, `capital.commitment.funded`, `capital.commitment.withdrawn` |
| Bill | `capital.bill.generated`, `capital.bill.paid`, `capital.bill.failed`, `capital.bill.reversed` |
| Distribution | `capital.distribution.scheduled`, `capital.distribution.completed`, `capital.distribution.failed` |
| Compliance | `capital.compliance.cleared`, `capital.compliance.review`, `capital.compliance.blocked` |

Each event carries an envelope: `{ id, ts, ventureId, actor, topic, payload, correlationId?, metadata? }`.

## Integration in ~50 LOC

### 1. Install

```bash
pnpm add @mcv/capital-sdk@^0.2.0
```

(If your venture is in the same pnpm workspace, `workspace:*` works.)

### 2. Construct the adapter at process start

```ts
// apps/<venture>/src/lib/mcv/capital-adapter.ts
import {
  createVentureAdapter,
  createDefaultPublisher,
  type VentureAdapter,
} from '@mcv/capital-sdk';
import { supabase } from '../supabase'; // OR undefined if venture is Prisma-only

const publisher = createDefaultPublisher({
  supabase,
  fabricUrl: process.env.FABRIC_URL,
  fabricToken: process.env.FABRIC_TOKEN,
  includeConsole: process.env.NODE_ENV !== 'production',
});

export const capitalAdapter: VentureAdapter = createVentureAdapter({
  ventureId: 'futurestate', // must match Venture.id seed row
  publisher,
});
```

### 3. Emit on every state transition

Every place the venture changes money-relevant state gets one call:

```ts
await capitalAdapter.emitBillPaid(
  { billId: bill.id, amount: bill.amountCents / 100, currency: 'CAD', stripeTransferId },
  { actor: { kind: 'user', id: userId }, correlationId: `bill:${bill.id}` },
);
```

Key rules:
- **Never await before the primary transaction commits.** Call `emit*` *after* Prisma/Supabase write succeeds.
- **Never catch `emit*`.** It's already fire-and-forget internally; adding your own try/catch hides publisher wiring bugs.
- **Do pass `correlationId`** when events group (e.g., a Distribution and all its DistributionLegs share one correlation).

### 4. (Optional) Subscribe on the consumer side

Consumers (dashboards, analytics, cross-venture bus) subscribe either to:
- The Supabase `notifications` table (RLS-scoped by `source='capital'`), or
- The Fabric topic namespace `capital.*` via the configured Fabric URL.

Event shape on the wire matches the `CapitalEvent` Zod schema exactly.

## Publisher composition recipes

### Supabase only (current mcv-one-desktop default)

```ts
createDefaultPublisher({ supabase });
```

### Fabric only (pure protocol consumer, no local DB)

```ts
createDefaultPublisher({
  fabricUrl: 'https://fabric.mcv.one/events',
  fabricToken: process.env.FABRIC_TOKEN,
});
```

### Dual sink + dev console

```ts
createDefaultPublisher({
  supabase,
  fabricUrl: process.env.FABRIC_URL,
  includeConsole: true,
});
```

### Prisma venture (Futurestate): no Supabase — write to your own table

Implement `CapitalEventPublisher` directly:

```ts
import type { CapitalEventPublisher } from '@mcv/capital-sdk';
import { prisma } from '@/lib/prisma';

export const prismaPublisher: CapitalEventPublisher = {
  async publish(event) {
    try {
      await prisma.notification.create({
        data: {
          source: 'capital',
          type: 'info',
          title: event.topic.split('.').slice(1).join(' '),
          description: JSON.stringify(event.payload).slice(0, 200),
          ventureId: event.ventureId,
          metadata: {
            eventId: event.id, eventTs: event.ts, topic: event.topic,
            correlationId: event.correlationId, actor: event.actor,
          },
        },
      });
    } catch (err) {
      console.warn(`[capital-adapter/prisma] ${event.topic} insert failed:`, err);
    }
  },
};
```

Compose with Fabric for cross-repo visibility:

```ts
import { composePublishers, createFabricPublisher } from '@mcv/capital-sdk';

const publisher = composePublishers(
  prismaPublisher,
  createFabricPublisher({ url: process.env.FABRIC_URL!, token: process.env.FABRIC_TOKEN }),
);
```

This is how Futurestate joins the Capital Ecosystem Bus without dual-writing to Supabase.

## Testing

Tests supplied in `packages/capital-sdk/src/__tests__/venture-adapter.test.ts`:
- Every topic accepts its minimum-valid payload.
- Unknown topic rejected.
- `composePublishers` swallows individual failures.
- Adapter stamps id/ts/ventureId/actor.
- Adapter never throws on publisher failure.
- Fabric publisher sets bearer auth and swallows non-2xx.

Run: `pnpm --filter @mcv/capital-sdk test`.

## Seven-venture mapping

| Venture | ventureId | Topics most used |
|---|---|---|
| Futurestate | `futurestate` | commitment.*, bill.*, distribution.* (RE yield + capital calls) |
| BetEdge | `betedge` | distribution.* (REFERRAL_REWARD / QUEST_REWARD / ENGAGEMENT_PAYOUT), compliance.* (age / jurisdiction) |
| WarForge | `warforge` | distribution.* (ROYALTY_PAYOUT) |
| MCV.gg | `mcvgg` | call.* (TOKEN_PRESALE), distribution.* (TOKEN_TGE_LAUNCH / TOKEN_LIQUIDITY_PROVISION) |
| ARQ Labs | `arq` | call.*, commitment.* (STARTUP_EQUITY_CROWDFUND / STARTUP_SAFE_PRESALE) |
| EdgeIQ Markets | `edgeiq-markets` | distribution.* (ROYALTY_PAYOUT on subscription rev share) |
| MCV Platform | `mcv-platform` | distribution.* (PLATFORM_FEE_SPLIT aggregation from every other venture) |

Each venture's `ventureId` must exactly match its row in the `ventures` table (or `Venture` Prisma model once Phase 3 seeds land).

## What to emit when

### Capital calls (Futurestate, ARQ Labs)

- On admin creating a DRAFT: **do not emit yet.**
- On transition to PUBLISHED or ACTIVE: `emitCallPublished` or `emitCallCreated` (created for brand-new, published for draft→active).
- On aggregate commitment crossing funding threshold: `emitCallFunded`.
- On cleanup: `emitCallClosed` with reason, or `emitCallDefaulted` if short.

### Commitments (every venture with investor intake)

- On investor clicking "commit": `emitCommitmentCreated`.
- On successful funding (Stripe/Plaid/wire reconcile): `emitCommitmentFunded` with `rail`.
- On investor withdrawal or admin reversal: `emitCommitmentWithdrawn`.

### Bills (Futurestate capital call payouts, vendor invoices)

- On bill row creation: `emitBillGenerated`.
- On webhook confirming transfer success: `emitBillPaid` (NOT on API call initiation — wait for webhook).
- On webhook returning failure: `emitBillFailed`.
- On reversal (rare, admin action): `emitBillReversed`.

### Distributions (every venture with outbound money)

- On scheduling/creation: `emitDistributionScheduled`.
- On all legs settled: `emitDistributionCompleted` with `legCount` and optional `legFailedCount`.
- On all legs failing: `emitDistributionFailed`.

### Compliance (every venture with intake or payout)

- Gate check pass: `emitComplianceCleared`.
- Ambiguous/hold: `emitComplianceReview`.
- Hard block: `emitComplianceBlocked`.

## Backwards compatibility with existing `publishCapitalEvent`

`api/_handlers/capital.ts` already calls `notifier.publishCapitalEvent(topic, payload, opts)`. That API remains functional for v0.2.0. Migrate call sites to `capitalAdapter.emit*` incrementally — both paths write the same `notifications` row until Phase 3 cutover.

## FAQ

**Q: Why not just write directly to Fabric?**
A: Because not every deployment has Fabric wired. The publisher abstraction lets dev environments fall back to console + Supabase without code changes.

**Q: What if my venture has a new topic not in the v0.2 list?**
A: Use `adapter.emit(topic, payload, opts)` escape hatch for experimental topics, then propose an addition to the Zod union when stable. Never invent an ad-hoc sink.

**Q: How do I correlate a multi-leg distribution?**
A: Pass `correlationId` (e.g., the distribution's UUID) to every `emit*` call for its legs. Consumers group on this key.

**Q: Can I mock the adapter in tests?**
A: Yes — pass a `CapitalEventPublisher` that captures to an array. The adapter is fully testable in isolation (see test file).
