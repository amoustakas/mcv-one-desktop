// @ts-nocheck
// src/lib/compliance/dunning-manager.ts
// Dunning Manager — smart retry scheduling and payment recovery
// MCV Commerce & Financial OS — Plan 6

import { supabase } from '../supabase';
import type {
  DunningConfig,
  DunningFinalAction,
  DunningState,
  DunningStatus,
  PaymentRail,
} from './types';

// ─────────────────────────────────────────────────────────
// DEFAULT RETRY SCHEDULE
// Day 1 (same rail), Day 3 (different rail + email),
// Day 5 (smart timing + push), Day 7 (final + urgent email),
// Day 10 (grace expires → final action)
// ─────────────────────────────────────────────────────────

const DEFAULT_DUNNING_CONFIG: Omit<DunningConfig, 'ventureId'> = {
  retrySchedule: [
    { dayAfterFailure: 1,  retryTime: '09:00', rail: 'stripe' },
    { dayAfterFailure: 3,  retryTime: '14:00', rail: 'paypal' },
    { dayAfterFailure: 5,  retryTime: '10:00', rail: 'stripe' },
    { dayAfterFailure: 7,  retryTime: '08:00', rail: 'stripe' },
  ],
  notificationSchedule: [
    { dayAfterFailure: 0, channel: 'email', template: 'payment_failed_friendly', tone: 'friendly' },
    { dayAfterFailure: 3, channel: 'email', template: 'payment_retry_notice',    tone: 'neutral' },
    { dayAfterFailure: 5, channel: 'push',  template: 'payment_action_required', tone: 'neutral' },
    { dayAfterFailure: 7, channel: 'email', template: 'payment_final_warning',   tone: 'urgent' },
  ],
  gracePeriodDays: 10,
  finalAction: 'cancel',
  smartRetryEnabled: true,
};

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function setTimeOfDay(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date(date);
  d.setUTCHours(hours, minutes, 0, 0);
  return d;
}

function computeNextRetry(
  failedAt: Date,
  retryCount: number,
  config: DunningConfig,
): Date | null {
  const schedule = config.retrySchedule;
  if (retryCount >= schedule.length) return null; // all retries exhausted
  const step = schedule[retryCount];
  const base = addDays(failedAt, step.dayAfterFailure);
  return setTimeOfDay(base, step.retryTime);
}

// ─────────────────────────────────────────────────────────
// CONFIG CRUD
// ─────────────────────────────────────────────────────────

export async function getDunningConfig(ventureId: string): Promise<DunningConfig> {
  if (!supabase) return { ventureId, ...DEFAULT_DUNNING_CONFIG };

  const { data } = await supabase
    .from('dunning_configs')
    .select('*')
    .eq('venture_id', ventureId)
    .single();

  if (!data) return { ventureId, ...DEFAULT_DUNNING_CONFIG };

  return {
    ventureId: data.venture_id,
    retrySchedule: data.retry_schedule ?? DEFAULT_DUNNING_CONFIG.retrySchedule,
    notificationSchedule: data.notification_schedule ?? DEFAULT_DUNNING_CONFIG.notificationSchedule,
    gracePeriodDays: data.grace_period_days ?? DEFAULT_DUNNING_CONFIG.gracePeriodDays,
    finalAction: (data.final_action ?? DEFAULT_DUNNING_CONFIG.finalAction) as DunningFinalAction,
    smartRetryEnabled: data.smart_retry_enabled ?? DEFAULT_DUNNING_CONFIG.smartRetryEnabled,
  };
}

export async function updateDunningConfig(
  ventureId: string,
  config: Partial<Omit<DunningConfig, 'ventureId'>>,
): Promise<DunningConfig> {
  const current = await getDunningConfig(ventureId);
  const merged: DunningConfig = { ...current, ...config, ventureId };

  if (!supabase) return merged;

  await supabase
    .from('dunning_configs')
    .upsert({
      venture_id: ventureId,
      retry_schedule: merged.retrySchedule,
      notification_schedule: merged.notificationSchedule,
      grace_period_days: merged.gracePeriodDays,
      final_action: merged.finalAction,
      smart_retry_enabled: merged.smartRetryEnabled,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'venture_id' });

  return merged;
}

// ─────────────────────────────────────────────────────────
// INITIATE DUNNING
// Called when a subscription payment fails
// ─────────────────────────────────────────────────────────

export async function initiateDunning(
  subscriptionId: string,
  paymentIntentId: string,
  ventureId: string,
): Promise<DunningState | null> {
  if (!supabase) return null;

  const config = await getDunningConfig(ventureId);
  const failedAt = new Date();
  const nextRetryAt = computeNextRetry(failedAt, 0, config);

  const { data, error } = await supabase
    .from('dunning_states')
    .insert({
      subscription_id: subscriptionId,
      payment_intent_id: paymentIntentId,
      failed_at: failedAt.toISOString(),
      retry_count: 0,
      next_retry_at: nextRetryAt?.toISOString() ?? null,
      status: 'active',
    })
    .select()
    .single();

  if (error || !data) return null;
  return mapDunningRow(data);
}

// ─────────────────────────────────────────────────────────
// PROCESS RETRIES
// Cron-callable: finds all active dunning states due for retry
// ─────────────────────────────────────────────────────────

export interface RetryResult {
  dunningId: string;
  subscriptionId: string;
  rail: PaymentRail;
  attempted: boolean;
  recovered: boolean;
  error?: string;
}

export async function processRetries(ventureId: string): Promise<RetryResult[]> {
  if (!supabase) return [];

  const config = await getDunningConfig(ventureId);
  const now = new Date().toISOString();

  const { data: dueStates } = await supabase
    .from('dunning_states')
    .select('*')
    .eq('status', 'active')
    .lte('next_retry_at', now);

  if (!dueStates || dueStates.length === 0) return [];

  const results: RetryResult[] = [];

  for (const row of dueStates) {
    const state = mapDunningRow(row);
    const retryIdx = state.retryCount;
    const step = config.retrySchedule[retryIdx];

    if (!step) {
      // No more retry steps — exhaust
      await markExhausted(state.id, config);
      results.push({
        dunningId: state.id,
        subscriptionId: state.subscriptionId,
        rail: 'stripe',
        attempted: false,
        recovered: false,
        error: 'retry_schedule_exhausted',
      });
      continue;
    }

    // Attempt payment via the configured rail
    // In production: call the payment router (src/lib/payments/router.ts)
    // Here we log the attempt and assume the caller handles actual charge
    const attempted = true;
    const recovered = false; // real impl: await paymentRouter.retryCharge(...)

    if (recovered) {
      await markRecovered(state.id);
    } else {
      // Advance to next retry
      const newRetryCount = state.retryCount + 1;
      const failedAt = new Date(state.failedAt);
      const nextRetryAt = computeNextRetry(failedAt, newRetryCount, config);

      // Check grace period
      const daysSinceFailure = (Date.now() - failedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceFailure >= config.gracePeriodDays || !nextRetryAt) {
        await markExhausted(state.id, config);
      } else {
        await supabase
          .from('dunning_states')
          .update({
            retry_count: newRetryCount,
            next_retry_at: nextRetryAt?.toISOString() ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.id);
      }
    }

    results.push({
      dunningId: state.id,
      subscriptionId: state.subscriptionId,
      rail: step.rail,
      attempted,
      recovered,
    });
  }

  return results;
}

// ─────────────────────────────────────────────────────────
// MARK RECOVERED
// ─────────────────────────────────────────────────────────

export async function markRecovered(dunningId: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from('dunning_states')
    .update({
      status: 'recovered',
      recovered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', dunningId);
}

// ─────────────────────────────────────────────────────────
// MARK EXHAUSTED → execute final action
// ─────────────────────────────────────────────────────────

export async function markExhausted(
  dunningId: string,
  config?: DunningConfig,
): Promise<void> {
  if (!supabase) return;

  await supabase
    .from('dunning_states')
    .update({
      status: 'exhausted',
      next_retry_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dunningId);

  // Execute final action — in production: call subscription service
  const finalAction = config?.finalAction ?? 'cancel';
  console.info(`[dunning] Final action "${finalAction}" for dunning state ${dunningId}`);
  // await subscriptionService.executeFinalAction(dunningId, finalAction);
}

// ─────────────────────────────────────────────────────────
// DUNNING STATS
// ─────────────────────────────────────────────────────────

export interface DunningStats {
  activeCount: number;
  recoveredThisMonth: number;
  exhaustedThisMonth: number;
  recoveryRate: number; // 0-1
  revenueAtRisk: number; // approximate count * avg (placeholder)
}

export async function getDunningStats(ventureId: string): Promise<DunningStats> {
  if (!supabase) {
    return { activeCount: 0, recoveredThisMonth: 0, exhaustedThisMonth: 0, recoveryRate: 0, revenueAtRisk: 0 };
  }

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [activeRes, recoveredRes, exhaustedRes] = await Promise.all([
    supabase.from('dunning_states').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('dunning_states').select('id', { count: 'exact', head: true })
      .eq('status', 'recovered')
      .gte('recovered_at', monthStart.toISOString()),
    supabase.from('dunning_states').select('id', { count: 'exact', head: true })
      .eq('status', 'exhausted')
      .gte('updated_at', monthStart.toISOString()),
  ]);

  const activeCount = activeRes.count ?? 0;
  const recoveredThisMonth = recoveredRes.count ?? 0;
  const exhaustedThisMonth = exhaustedRes.count ?? 0;
  const total = recoveredThisMonth + exhaustedThisMonth;
  const recoveryRate = total > 0 ? recoveredThisMonth / total : 0;

  return {
    activeCount,
    recoveredThisMonth,
    exhaustedThisMonth,
    recoveryRate,
    revenueAtRisk: activeCount * 2999, // placeholder: avg MRR per dunning case in cents
  };
}

// ─────────────────────────────────────────────────────────
// ROW MAPPER
// ─────────────────────────────────────────────────────────

function mapDunningRow(row: Record<string, unknown>): DunningState {
  return {
    id: row.id as string,
    subscriptionId: row.subscription_id as string,
    paymentIntentId: row.payment_intent_id as string,
    failedAt: row.failed_at as string,
    retryCount: row.retry_count as number,
    nextRetryAt: (row.next_retry_at as string | null) ?? null,
    status: row.status as DunningStatus,
    recoveredAt: (row.recovered_at as string | null) ?? null,
  };
}
