// packages/events-sdk/src/contracts/commerce.ts
//
// Commerce + Financial OS emissions + subscriptions.
//
// Commerce doesn't currently use the Fabric publish helper — these are
// forward-looking contracts that let workflows (M-F2) + agents (M-F3)
// subscribe today. Once commerce handlers adopt events-sdk, the emissions
// wire up without consumers needing to change.

import { z } from 'zod';
import type { ContractDeclaration } from '../types.js';

const OrderStatus = z.enum(['draft','pending','paid','fulfilled','cancelled','refunded','flagged']);
const SubscriptionStatus = z.enum(['active','past_due','cancelled','paused','trial']);

export const CommerceContract: ContractDeclaration<'commerce'> = {
  module: 'commerce',
  version: '1.0',

  emits: [
    // ── Orders ──────────────────────────────────────────────────────────
    {
      topic: 'commerce.order.created',
      schemaVersion: '1.0',
      payload: z.object({
        orderId: z.string().uuid(),
        ventureId: z.string().nullable(),
        totalUsd: z.number(),
        itemCount: z.number(),
      }),
      description: 'New order created in a venture storefront.',
    },
    {
      topic: 'commerce.order.paid',
      schemaVersion: '1.0',
      payload: z.object({
        orderId: z.string().uuid(),
        ventureId: z.string().nullable(),
        totalUsd: z.number(),
        paymentProcessor: z.string(),
      }),
      description: 'Order payment cleared — triggers revenue recognition + royalty ledger entries.',
    },
    {
      topic: 'commerce.order.fulfilled',
      schemaVersion: '1.0',
      payload: z.object({
        orderId: z.string().uuid(),
        fulfillmentProvider: z.string(),
      }),
      description: 'Order marked fulfilled (shipped / delivered / digital-issued).',
    },
    {
      topic: 'commerce.order.refunded',
      schemaVersion: '1.0',
      payload: z.object({
        orderId: z.string().uuid(),
        amountUsd: z.number(),
        reason: z.string().nullable(),
      }),
      description: 'Order refund settled (full or partial).',
    },
    {
      topic: 'commerce.order.flagged',
      schemaVersion: '1.0',
      payload: z.object({
        orderId: z.string().uuid(),
        reason: z.string(),
        riskScore: z.number().nullable(),
      }),
      description: 'Order flagged for review (fraud / trademark / chargeback risk).',
    },

    // ── Subscriptions ───────────────────────────────────────────────────
    {
      topic: 'commerce.subscription.created',
      schemaVersion: '1.0',
      payload: z.object({
        subscriptionId: z.string().uuid(),
        customerId: z.string().uuid(),
        planId: z.string(),
        status: SubscriptionStatus,
      }),
      description: 'Recurring subscription activated.',
    },
    {
      topic: 'commerce.subscription.cancelled',
      schemaVersion: '1.0',
      payload: z.object({
        subscriptionId: z.string().uuid(),
        reason: z.string().nullable(),
      }),
      description: 'Subscription cancelled (customer or billing failure).',
    },

    // ── Inventory ───────────────────────────────────────────────────────
    {
      topic: 'commerce.inventory.low',
      schemaVersion: '1.0',
      payload: z.object({
        productId: z.string().uuid(),
        sku: z.string(),
        remaining: z.number(),
        threshold: z.number(),
      }),
      description: 'Inventory crossed the low-stock threshold. Operator action suggested.',
    },

    // ── Reviews ─────────────────────────────────────────────────────────
    {
      topic: 'commerce.review.submitted',
      schemaVersion: '1.0',
      payload: z.object({
        reviewId: z.string().uuid(),
        productId: z.string().uuid(),
        rating: z.number().min(1).max(5),
      }),
      description: 'Customer review submitted. Agents may auto-moderate.',
    },

    // ── Chargebacks ─────────────────────────────────────────────────────
    {
      topic: 'commerce.chargeback.received',
      schemaVersion: '1.0',
      payload: z.object({
        orderId: z.string().uuid(),
        processor: z.string(),
        amountUsd: z.number(),
        reasonCode: z.string(),
      }),
      description: 'Processor-issued chargeback. Triggers evidence gathering workflow.',
    },

    // Exported for type-inference by subscribers — placeholder, expands as
    // commerce modules ship more events.
    {
      topic: 'commerce.metrics.daily-close',
      schemaVersion: '1.0',
      payload: z.object({
        date: z.string(),
        revenueUsd: z.number(),
        orderCount: z.number(),
      }),
      description: 'Daily commerce close — triggers dashboard snapshot + finance reconciliation.',
    },
  ],

  subscribes: [
    {
      topicPattern: 'capital.distribution.paid',
      description:
        'Distribution payouts may affect treasury balances shown in commerce-finance dashboards.',
    },
    {
      topicPattern: 'foundation.ip-mark.status-changed',
      description:
        'Trademark registration affects product listing gating — unregistered marks may not appear in retail lanes.',
    },
  ],
};

// Re-export typed OrderStatus so consumers outside this file can use it.
export { OrderStatus, SubscriptionStatus };
