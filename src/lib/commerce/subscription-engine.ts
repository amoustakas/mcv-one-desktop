// src/lib/commerce/subscription-engine.ts
// Commerce layer — Subscription lifecycle management, overages, and ledger integration
// Tier 5 — consumes Ledger (Tier 2) and Supabase

import { supabase } from '../supabase';
import {
  createJournalEntry,
  postJournalEntry,
  getAccountByCode,
} from '../ledger/service';
import {
  CreateSubscriptionInput,
  type Subscription,
  type SubscriptionStatus,
  type UsageRecord,
  type OverageBehavior,
} from './types';

// ─────────────────────────────────────────────────────────
// ACCOUNT CODES (Chart of Accounts)
// ─────────────────────────────────────────────────────────
// 1010 — Cash
// 1020 — Accounts Receivable
// 4010 — Revenue — Subscriptions
// 4120 — Revenue — Metered Usage

const ACCOUNT = {
  CASH: '1010',
  AR: '1020',
  REVENUE_SUBSCRIPTIONS: '4010',
  REVENUE_METERED: '4120',
} as const;

// ─────────────────────────────────────────────────────────
// ROW MAPPER (snake_case DB → camelCase TypeScript)
// ─────────────────────────────────────────────────────────

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
    metadata: (parseJson<Record<string, unknown>>(row.metadata)) ?? {},
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

// ─────────────────────────────────────────────────────────
// LEDGER HELPERS
// ─────────────────────────────────────────────────────────

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
  const debitAccount = await getAccountByCode(
    params.ventureId,
    params.useAR ? ACCOUNT.AR : ACCOUNT.CASH,
  );
  const creditAccount = await getAccountByCode(params.ventureId, ACCOUNT.REVENUE_SUBSCRIPTIONS);

  if (!debitAccount || !creditAccount) {
    // Accounts not provisioned yet — skip ledger entry, don't hard-fail the business operation
    console.warn(
      `[subscription-engine] Ledger accounts not found for venture ${params.ventureId} — skipping journal entry`,
    );
    return;
  }

  const entry = await createJournalEntry({
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

  await postJournalEntry(entry.id, 'system');
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
  const cashAccount = await getAccountByCode(params.ventureId, ACCOUNT.CASH);
  const revenueMetered = await getAccountByCode(params.ventureId, ACCOUNT.REVENUE_METERED);

  if (!cashAccount || !revenueMetered) {
    console.warn(
      `[subscription-engine] Ledger accounts not found for overage in venture ${params.ventureId} — skipping`,
    );
    return;
  }

  const entry = await createJournalEntry({
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

  await postJournalEntry(entry.id, 'system');
}

// ─────────────────────────────────────────────────────────
// PERIOD HELPERS
// ─────────────────────────────────────────────────────────

type Interval = 'day' | 'week' | 'month' | 'year';

function advancePeriod(
  from: Date,
  interval: Interval,
  intervalCount: number,
): Date {
  const d = new Date(from);
  switch (interval) {
    case 'day':
      d.setDate(d.getDate() + intervalCount);
      break;
    case 'week':
      d.setDate(d.getDate() + intervalCount * 7);
      break;
    case 'month':
      d.setMonth(d.getMonth() + intervalCount);
      break;
    case 'year':
      d.setFullYear(d.getFullYear() + intervalCount);
      break;
  }
  return d;
}

// ─────────────────────────────────────────────────────────
// LIFECYCLE OPERATIONS
// ─────────────────────────────────────────────────────────

export async function createSubscription(input: CreateSubscriptionInput): Promise<Subscription> {
  if (!supabase) throw new Error('Supabase client not available');

  const validated = CreateSubscriptionInput.parse(input);

  // Determine initial status: trial if trialEnd is in the future
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

  // Create ledger entry: DR Cash/AR, CR Revenue-Subscriptions
  // Only post if subscription is not trialing (no cash collected yet on trial)
  if (status !== 'trialing') {
    // Fetch plan price from subscription_plans table if available
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('price, interval, interval_count')
      .eq('id', validated.planId)
      .single();

    if (plan) {
      const price = (plan.price as Record<string, unknown>);
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
}

export async function upgradeSubscription(
  id: string,
  ventureId: string,
  newPlanId: string,
): Promise<Subscription> {
  if (!supabase) throw new Error('Supabase client not available');

  // Get current subscription and new plan details
  const { data: current, error: currentError } = await supabase
    .from('subscriptions')
    .select()
    .eq('id', id)
    .eq('venture_id', ventureId)
    .single();

  if (currentError) throw new Error(`Subscription not found: ${currentError.message}`);

  const sub = mapSubscriptionRow(current);

  // Fetch both plans for proration
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

  // Apply upgrade immediately
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

  // Prorate if both plans exist and the product is configured to prorate on upgrade
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

      const oldPrice = (oldPlan.price as Record<string, unknown>);
      const newPrice = (newPlan.price as Record<string, unknown>);
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
}

export async function downgradeSubscription(
  id: string,
  ventureId: string,
  newPlanId: string,
): Promise<Subscription> {
  if (!supabase) throw new Error('Supabase client not available');

  // Downgrade takes effect at period end — store pending plan in metadata
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
}

export async function cancelSubscription(
  id: string,
  ventureId: string,
  immediate = false,
): Promise<Subscription> {
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
}

export async function pauseSubscription(
  id: string,
  ventureId: string,
): Promise<Subscription> {
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
}

export async function resumeSubscription(
  id: string,
  ventureId: string,
): Promise<Subscription> {
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
}

export async function renewSubscription(
  id: string,
  ventureId: string,
): Promise<Subscription> {
  if (!supabase) throw new Error('Supabase client not available');

  const { data: current, error: fetchError } = await supabase
    .from('subscriptions')
    .select()
    .eq('id', id)
    .eq('venture_id', ventureId)
    .single();

  if (fetchError) throw new Error(`Subscription not found: ${fetchError.message}`);

  const sub = mapSubscriptionRow(current);

  // Fetch plan to determine interval
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('price, interval, interval_count')
    .eq('id', sub.planId)
    .single();

  const interval = (plan?.interval as Interval) ?? 'month';
  const intervalCount = Number(plan?.interval_count ?? 1);

  const newPeriodStart = new Date(sub.currentPeriodEnd);
  const newPeriodEnd = advancePeriod(newPeriodStart, interval, intervalCount);

  // Apply pending downgrade if scheduled
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

  // Post renewal ledger entry
  if (plan) {
    const price = (plan.price as Record<string, unknown>);
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
}

// ─────────────────────────────────────────────────────────
// USAGE RECORDING
// ─────────────────────────────────────────────────────────

export async function recordUsage(
  subscriptionId: string,
  meterId: string,
  quantity: number,
  idempotencyKey: string,
): Promise<UsageRecord> {
  if (!supabase) throw new Error('Supabase client not available');

  // Idempotency check — return existing record if key already exists
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

  // Fire-and-forget overage check after recording
  checkOverages(subscriptionId).catch((err) =>
    console.warn('[subscription-engine] Overage check failed:', err),
  );

  return record;
}

// ─────────────────────────────────────────────────────────
// OVERAGE CHECKING
// ─────────────────────────────────────────────────────────

export interface OverageResult {
  exceeded: boolean;
  meter: string;
  used: number;
  limit: number | null;
  action: OverageBehavior | null;
  overageAmount?: number;
  perUnitPrice?: number | null;
}

export async function checkOverages(subscriptionId: string): Promise<OverageResult[]> {
  if (!supabase) return [];

  // 1. Get subscription
  const { data: subData, error: subError } = await supabase
    .from('subscriptions')
    .select()
    .eq('id', subscriptionId)
    .single();

  if (subError) throw new Error(`Subscription not found: ${subError.message}`);

  const sub = mapSubscriptionRow(subData);

  // 2. Get associated product for plan config
  if (!sub.productId) return [];

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('metered_config, subscription_config')
    .eq('id', sub.productId)
    .single();

  if (productError || !product) return [];

  // 3. Get plan to retrieve limits
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('limits, overage')
    .eq('id', sub.planId)
    .single();

  if (!plan) return [];

  const planLimits = (plan.limits as Record<string, unknown>) ?? {};
  const planOverage = plan.overage as Record<string, unknown> | null;

  if (!planOverage) return [];

  // 4. Get usage records for current period
  const { data: usageRecords, error: usageError } = await supabase
    .from('usage_records')
    .select()
    .eq('subscription_id', subscriptionId)
    .gte('timestamp', sub.currentPeriodStart)
    .lte('timestamp', sub.currentPeriodEnd);

  if (usageError) throw new Error(`Failed to fetch usage records: ${usageError.message}`);

  // 5. Aggregate usage by meter
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

  // 6. Compare against plan limits
  const results: OverageResult[] = [];

  for (const [meterId, used] of usageByMeter.entries()) {
    const limit = planLimits[meterId] !== undefined ? Number(planLimits[meterId]) : null;

    if (limit === null) continue; // no limit configured for this meter

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

      // Post overage ledger entry if there's a charge
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
}
