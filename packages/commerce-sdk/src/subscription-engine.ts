// @mcv/commerce-sdk/subscription-engine — subscription lifecycle, proration,
// usage metering, overage billing.
//
// 10 methods behind createSubscriptionEngine({ supabase, ledger }):
//
// Lifecycle
//   createSubscription     auto-detects trialing status; posts revenue
//                          only for non-trial subs
//   upgradeSubscription    immediate plan change + prorated charge for
//                          remaining period (if both plans exist and
//                          product.subscription_config.prorateOnUpgrade
//                          isn't explicitly false)
//   downgradeSubscription  takes effect at period end — stores pending
//                          plan id in metadata, applied by renewSubscription
//   cancelSubscription     immediate or at-period-end
//   pauseSubscription / resumeSubscription
//   renewSubscription      advances the period, posts fresh revenue,
//                          applies any pending downgrade in one step
//
// Usage & overages
//   recordUsage            idempotent inserts keyed on idempotencyKey;
//                          fires-and-forgets checkOverages on success
//   checkOverages          aggregates usage by meter, compares against
//                          plan limits, posts overage revenue (DR Cash,
//                          CR 4120 Revenue - Metered Usage) when the
//                          overage behavior is 'charge'
//
// Ledger failure mode: if required accounts aren't provisioned yet, the
// journal is logged-and-skipped rather than hard-failing the subscription
// mutation. The original code's behavior is preserved verbatim.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CreateSubscriptionInput,
  type Subscription,
  type SubscriptionStatus,
  type UsageRecord,
  type OverageBehavior,
} from './types';

// ─── Adapter ────────────────────────────────────────────────────────────
// Shared contract lives in @mcv/ledger-sdk — re-exported here so anyone
// importing from this subpath keeps working.

import type { LedgerAdapter } from '@mcv/ledger-sdk';
export type {
  LedgerAccountRef,
  LedgerJournalEntryRef,
  LedgerJournalEntryInput,
  LedgerAdapter,
} from '@mcv/ledger-sdk';

// ─── Chart-of-accounts codes used by this engine ───────────────────────

const ACCOUNT = {
  CASH: '1010',
  AR: '1020',
  REVENUE_SUBSCRIPTIONS: '4010',
  REVENUE_METERED: '4120',
} as const;

// ─── Pure helpers ──────────────────────────────────────────────────────

type Interval = 'day' | 'week' | 'month' | 'year';

function advancePeriod(from: Date, interval: Interval, intervalCount: number): Date {
  const d = new Date(from);
  switch (interval) {
    case 'day':   d.setDate(d.getDate() + intervalCount); break;
    case 'week':  d.setDate(d.getDate() + intervalCount * 7); break;
    case 'month': d.setMonth(d.getMonth() + intervalCount); break;
    case 'year':  d.setFullYear(d.getFullYear() + intervalCount); break;
  }
  return d;
}

// ─── Row mappers ────────────────────────────────────────────────────────

export function mapSubscriptionRow(row: Record<string, unknown>): Subscription {
  const parseJson = <T>(value: unknown): T | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object') return value as T;
    if (typeof value === 'string') {
      try { return JSON.parse(value) as T; } catch { return null; }
    }
    return null;
  };

  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    customerId: row.customer_id as string,
    planId: row.plan_id as string,
    productId: (row.product_id as string) ?? null,
    status: row.status as SubscriptionStatus,
    currentPeriodStart: row.current_period_start as string,
    currentPeriodEnd: row.current_period_end as string,
    trialEnd: (row.trial_end as string) ?? null,
    cancelAtPeriodEnd: (row.cancel_at_period_end as boolean) ?? false,
    quantity: (row.quantity as number) ?? 1,
    metadata: parseJson<Record<string, unknown>>(row.metadata) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapUsageRecordRow(row: Record<string, unknown>): UsageRecord {
  return {
    id: row.id as string,
    subscriptionId: row.subscription_id as string,
    meterId: row.meter_id as string,
    quantity: row.quantity as number,
    timestamp: row.timestamp as string,
    idempotencyKey: row.idempotency_key as string,
    action: (row.action as 'increment' | 'set') ?? 'increment',
  };
}

// ─── Engine interface ──────────────────────────────────────────────────

export interface OverageResult {
  exceeded: boolean;
  meter: string;
  used: number;
  limit: number | null;
  action: OverageBehavior | null;
  overageAmount?: number;
  perUnitPrice?: number | null;
}

export interface SubscriptionEngine {
  createSubscription(input: CreateSubscriptionInput): Promise<Subscription>;
  upgradeSubscription(id: string, ventureId: string, newPlanId: string): Promise<Subscription>;
  downgradeSubscription(id: string, ventureId: string, newPlanId: string): Promise<Subscription>;
  cancelSubscription(id: string, ventureId: string, immediate?: boolean): Promise<Subscription>;
  pauseSubscription(id: string, ventureId: string): Promise<Subscription>;
  resumeSubscription(id: string, ventureId: string): Promise<Subscription>;
  renewSubscription(id: string, ventureId: string): Promise<Subscription>;
  recordUsage(
    subscriptionId: string,
    meterId: string,
    quantity: number,
    idempotencyKey: string,
  ): Promise<UsageRecord>;
  checkOverages(subscriptionId: string): Promise<OverageResult[]>;
}

export interface SubscriptionEngineOptions {
  supabase: SupabaseClient | null;
  ledger: LedgerAdapter;
}

// ─── Factory ───────────────────────────────────────────────────────────

export function createSubscriptionEngine({
  supabase,
  ledger,
}: SubscriptionEngineOptions): SubscriptionEngine {
  // Closed-over journal helpers. Log-and-skip when accounts are missing
  // so subscription mutations succeed even before a venture's chart-of-
  // accounts has been provisioned.
  async function postSubscriptionRevenue(params: {
    ventureId: string;
    sourceId: string;
    amount: number;
    currency: string;
    customerId: string;
    productId?: string | null;
    description: string;
    sourceType: string;
    useAR?: boolean;
  }): Promise<void> {
    const debitAccount = await ledger.getAccountByCode(
      params.ventureId,
      params.useAR ? ACCOUNT.AR : ACCOUNT.CASH,
    );
    const creditAccount = await ledger.getAccountByCode(params.ventureId, ACCOUNT.REVENUE_SUBSCRIPTIONS);

    if (!debitAccount || !creditAccount) {
      console.warn(
        `[subscription-engine] Ledger accounts not found for venture ${params.ventureId} — skipping journal entry`,
      );
      return;
    }

    const entry = await ledger.createJournalEntry({
      ventureId: params.ventureId,
      entryDate: new Date().toISOString(),
      description: params.description,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      lines: [
        {
          accountId: debitAccount.id,
          debitAmount: params.amount,
          creditAmount: 0,
          currency: params.currency,
          dimensions: {
            ventureId: params.ventureId,
            customerId: params.customerId,
            productId: params.productId ?? undefined,
          },
        },
        {
          accountId: creditAccount.id,
          debitAmount: 0,
          creditAmount: params.amount,
          currency: params.currency,
          dimensions: {
            ventureId: params.ventureId,
            customerId: params.customerId,
            productId: params.productId ?? undefined,
          },
        },
      ],
    });

    await ledger.postJournalEntry(entry.id, 'system');
  }

  async function postOverageRevenue(params: {
    ventureId: string;
    sourceId: string;
    amount: number;
    currency: string;
    customerId: string;
    productId?: string | null;
    description: string;
  }): Promise<void> {
    const cashAccount = await ledger.getAccountByCode(params.ventureId, ACCOUNT.CASH);
    const revenueMetered = await ledger.getAccountByCode(params.ventureId, ACCOUNT.REVENUE_METERED);

    if (!cashAccount || !revenueMetered) {
      console.warn(
        `[subscription-engine] Ledger accounts not found for overage in venture ${params.ventureId} — skipping`,
      );
      return;
    }

    const entry = await ledger.createJournalEntry({
      ventureId: params.ventureId,
      entryDate: new Date().toISOString(),
      description: params.description,
      sourceType: 'subscription_overage',
      sourceId: params.sourceId,
      lines: [
        {
          accountId: cashAccount.id,
          debitAmount: params.amount,
          creditAmount: 0,
          currency: params.currency,
          dimensions: {
            ventureId: params.ventureId,
            customerId: params.customerId,
            productId: params.productId ?? undefined,
          },
        },
        {
          accountId: revenueMetered.id,
          debitAmount: 0,
          creditAmount: params.amount,
          currency: params.currency,
          dimensions: {
            ventureId: params.ventureId,
            customerId: params.customerId,
            productId: params.productId ?? undefined,
          },
        },
      ],
    });

    await ledger.postJournalEntry(entry.id, 'system');
  }

  const engine: SubscriptionEngine = {
    async createSubscription(input) {
      if (!supabase) throw new Error('Supabase client not available');

      const validated = CreateSubscriptionInput.parse(input);

      // Auto-detect trialing status when trialEnd is in the future.
      let status: SubscriptionStatus = validated.status ?? 'active';
      if (validated.trialEnd && new Date(validated.trialEnd) > new Date()) {
        status = 'trialing';
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          venture_id: validated.ventureId,
          customer_id: validated.customerId,
          plan_id: validated.planId,
          product_id: validated.productId ?? null,
          status,
          current_period_start: validated.currentPeriodStart,
          current_period_end: validated.currentPeriodEnd,
          trial_end: validated.trialEnd ?? null,
          cancel_at_period_end: validated.cancelAtPeriodEnd ?? false,
          quantity: validated.quantity ?? 1,
          metadata: validated.metadata ?? {},
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create subscription: ${error.message}`);

      const subscription = mapSubscriptionRow(data);

      // Revenue journal only for non-trial subs — trial conversions fire
      // on renewSubscription when the first real period starts.
      if (status !== 'trialing') {
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('price, interval, interval_count')
          .eq('id', validated.planId)
          .single();

        if (plan) {
          const price = plan.price as Record<string, unknown>;
          const amount = Number(price?.amount ?? 0);
          const currency = (price?.currency as string) ?? 'USD';

          if (amount > 0) {
            await postSubscriptionRevenue({
              ventureId: validated.ventureId,
              sourceId: subscription.id,
              amount,
              currency,
              customerId: validated.customerId,
              productId: validated.productId,
              description: `Subscription created — plan ${validated.planId}`,
              sourceType: 'subscription_creation',
              useAR: false,
            });
          }
        }
      }

      return subscription;
    },

    async upgradeSubscription(id, ventureId, newPlanId) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data: current, error: currentError } = await supabase
        .from('subscriptions')
        .select()
        .eq('id', id)
        .eq('venture_id', ventureId)
        .single();

      if (currentError) throw new Error(`Subscription not found: ${currentError.message}`);

      const sub = mapSubscriptionRow(current);

      const { data: newPlan } = await supabase
        .from('subscription_plans')
        .select('price, interval, interval_count')
        .eq('id', newPlanId)
        .single();

      const { data: oldPlan } = await supabase
        .from('subscription_plans')
        .select('price, interval, interval_count')
        .eq('id', sub.planId)
        .single();

      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          plan_id: newPlanId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('venture_id', ventureId)
        .select()
        .single();

      if (error) throw new Error(`Failed to upgrade subscription: ${error.message}`);

      const updated = mapSubscriptionRow(data);

      // Prorate the remainder of the current period if both plans resolve
      // and the product hasn't opted out of prorate-on-upgrade.
      if (newPlan && oldPlan && sub.productId) {
        const { data: product } = await supabase
          .from('products')
          .select('subscription_config')
          .eq('id', sub.productId)
          .single();

        const subConfig = product?.subscription_config as Record<string, unknown> | null;
        const shouldProrate = subConfig?.prorateOnUpgrade !== false; // default true

        if (shouldProrate) {
          const periodStart = new Date(sub.currentPeriodStart);
          const periodEnd = new Date(sub.currentPeriodEnd);
          const now = new Date();
          const totalMs = periodEnd.getTime() - periodStart.getTime();
          const remainingMs = periodEnd.getTime() - now.getTime();
          const remainingFraction = totalMs > 0 ? remainingMs / totalMs : 0;

          const oldPrice = oldPlan.price as Record<string, unknown>;
          const newPrice = newPlan.price as Record<string, unknown>;
          const oldAmount = Number(oldPrice?.amount ?? 0);
          const newAmount = Number(newPrice?.amount ?? 0);
          const currency = (newPrice?.currency as string) ?? 'USD';

          const proratedDiff = (newAmount - oldAmount) * remainingFraction;

          if (proratedDiff > 0) {
            await postSubscriptionRevenue({
              ventureId,
              sourceId: id,
              amount: Math.round(proratedDiff * 100) / 100,
              currency,
              customerId: sub.customerId,
              productId: sub.productId,
              description: `Prorated upgrade from plan ${sub.planId} to ${newPlanId}`,
              sourceType: 'subscription_upgrade',
              useAR: false,
            });
          }
        }
      }

      return updated;
    },

    async downgradeSubscription(id, ventureId, newPlanId) {
      if (!supabase) throw new Error('Supabase client not available');

      // Deferred: pending plan id in metadata, applied by renewSubscription.
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          metadata: {
            pendingPlanId: newPlanId,
            pendingPlanChangeAt: 'period_end',
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('venture_id', ventureId)
        .select()
        .single();

      if (error) throw new Error(`Failed to schedule downgrade: ${error.message}`);
      return mapSubscriptionRow(data);
    },

    async cancelSubscription(id, ventureId, immediate = false) {
      if (!supabase) throw new Error('Supabase client not available');

      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (immediate) {
        updatePayload.status = 'canceled';
        updatePayload.cancel_at_period_end = false;
      } else {
        updatePayload.cancel_at_period_end = true;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .update(updatePayload)
        .eq('id', id)
        .eq('venture_id', ventureId)
        .select()
        .single();

      if (error) throw new Error(`Failed to cancel subscription: ${error.message}`);
      return mapSubscriptionRow(data);
    },

    async pauseSubscription(id, ventureId) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data, error } = await supabase
        .from('subscriptions')
        .update({ status: 'paused', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('venture_id', ventureId)
        .select()
        .single();

      if (error) throw new Error(`Failed to pause subscription: ${error.message}`);
      return mapSubscriptionRow(data);
    },

    async resumeSubscription(id, ventureId) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data, error } = await supabase
        .from('subscriptions')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('venture_id', ventureId)
        .select()
        .single();

      if (error) throw new Error(`Failed to resume subscription: ${error.message}`);
      return mapSubscriptionRow(data);
    },

    async renewSubscription(id, ventureId) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data: current, error: fetchError } = await supabase
        .from('subscriptions')
        .select()
        .eq('id', id)
        .eq('venture_id', ventureId)
        .single();

      if (fetchError) throw new Error(`Subscription not found: ${fetchError.message}`);

      const sub = mapSubscriptionRow(current);

      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('price, interval, interval_count')
        .eq('id', sub.planId)
        .single();

      const interval = (plan?.interval as Interval) ?? 'month';
      const intervalCount = Number(plan?.interval_count ?? 1);

      const newPeriodStart = new Date(sub.currentPeriodEnd);
      const newPeriodEnd = advancePeriod(newPeriodStart, interval, intervalCount);

      // Apply pending downgrade if scheduled — renewal is the natural
      // boundary for plan changes that defer to period end.
      const pendingPlanId = (sub.metadata?.pendingPlanId as string) ?? null;
      const updatePayload: Record<string, unknown> = {
        current_period_start: newPeriodStart.toISOString(),
        current_period_end: newPeriodEnd.toISOString(),
        status: 'active',
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      };

      if (pendingPlanId) {
        updatePayload.plan_id = pendingPlanId;
        updatePayload.metadata = { ...sub.metadata };
        delete (updatePayload.metadata as Record<string, unknown>).pendingPlanId;
        delete (updatePayload.metadata as Record<string, unknown>).pendingPlanChangeAt;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .update(updatePayload)
        .eq('id', id)
        .eq('venture_id', ventureId)
        .select()
        .single();

      if (error) throw new Error(`Failed to renew subscription: ${error.message}`);

      const renewed = mapSubscriptionRow(data);

      if (plan) {
        const price = plan.price as Record<string, unknown>;
        const amount = Number(price?.amount ?? 0);
        const currency = (price?.currency as string) ?? 'USD';

        if (amount > 0) {
          await postSubscriptionRevenue({
            ventureId,
            sourceId: id,
            amount,
            currency,
            customerId: sub.customerId,
            productId: sub.productId,
            description: `Subscription renewal — plan ${renewed.planId} period ${newPeriodStart.toISOString()}`,
            sourceType: 'subscription_renewal',
            useAR: false,
          });
        }
      }

      return renewed;
    },

    async recordUsage(subscriptionId, meterId, quantity, idempotencyKey) {
      if (!supabase) throw new Error('Supabase client not available');

      // Idempotency: dupes on the same key return the prior record.
      const { data: existing } = await supabase
        .from('usage_records')
        .select()
        .eq('idempotency_key', idempotencyKey)
        .single();

      if (existing) return mapUsageRecordRow(existing);

      const { data, error } = await supabase
        .from('usage_records')
        .insert({
          subscription_id: subscriptionId,
          meter_id: meterId,
          quantity,
          timestamp: new Date().toISOString(),
          idempotency_key: idempotencyKey,
          action: 'increment',
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to record usage: ${error.message}`);

      const record = mapUsageRecordRow(data);

      // Fire-and-forget overage check via self-reference so overrides /
      // decorators on the engine object are honored.
      engine.checkOverages(subscriptionId).catch((err) =>
        console.warn('[subscription-engine] Overage check failed:', err),
      );

      return record;
    },

    async checkOverages(subscriptionId) {
      if (!supabase) return [];

      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select()
        .eq('id', subscriptionId)
        .single();

      if (subError) throw new Error(`Subscription not found: ${subError.message}`);

      const sub = mapSubscriptionRow(subData);

      if (!sub.productId) return [];

      const { data: product, error: productError } = await supabase
        .from('products')
        .select('metered_config, subscription_config')
        .eq('id', sub.productId)
        .single();

      if (productError || !product) return [];

      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('limits, overage')
        .eq('id', sub.planId)
        .single();

      if (!plan) return [];

      const planLimits = (plan.limits as Record<string, unknown>) ?? {};
      const planOverage = plan.overage as Record<string, unknown> | null;

      if (!planOverage) return [];

      const { data: usageRecords, error: usageError } = await supabase
        .from('usage_records')
        .select()
        .eq('subscription_id', subscriptionId)
        .gte('timestamp', sub.currentPeriodStart)
        .lte('timestamp', sub.currentPeriodEnd);

      if (usageError) throw new Error(`Failed to fetch usage records: ${usageError.message}`);

      // Aggregate by meter — 'set' replaces, 'increment' adds.
      const usageByMeter = new Map<string, number>();
      for (const record of usageRecords ?? []) {
        const meterId = record.meter_id as string;
        const qty = record.quantity as number;
        const action = record.action as string;

        if (action === 'set') {
          usageByMeter.set(meterId, qty);
        } else {
          usageByMeter.set(meterId, (usageByMeter.get(meterId) ?? 0) + qty);
        }
      }

      const results: OverageResult[] = [];

      for (const [meterId, used] of usageByMeter.entries()) {
        const limit = planLimits[meterId] !== undefined ? Number(planLimits[meterId]) : null;

        if (limit === null) continue;

        const exceeded = used > limit;
        const overageBehavior = (planOverage?.behavior as OverageBehavior) ?? null;
        const perUnitPrice = (planOverage?.perUnitPrice as number) ?? null;

        const result: OverageResult = {
          exceeded,
          meter: meterId,
          used,
          limit,
          action: exceeded ? overageBehavior : null,
        };

        if (exceeded && overageBehavior === 'charge' && perUnitPrice !== null) {
          const overageUnits = used - limit;
          result.overageAmount = overageUnits * perUnitPrice;
          result.perUnitPrice = perUnitPrice;

          if (result.overageAmount > 0 && sub.productId) {
            await postOverageRevenue({
              ventureId: sub.ventureId,
              sourceId: subscriptionId,
              amount: result.overageAmount,
              currency: 'USD',
              customerId: sub.customerId,
              productId: sub.productId,
              description: `Overage charge — meter ${meterId} used ${used} / limit ${limit} units`,
            });
          }
        }

        results.push(result);
      }

      return results;
    },
  };

  return engine;
}
