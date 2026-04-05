// src/lib/finance/cost-intelligence.ts
// Cost Intelligence Engine — Processing fee analysis, smart routing savings, recommendations
// Reads from routing_decisions and payment_intents tables.

import { supabase } from '../supabase';
import type { CostIntelligence, CostRecommendation } from './types';

// ─────────────────────────────────────────────────────────
// DATE HELPERS
// ─────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────────────
// GET COST INTELLIGENCE
// ─────────────────────────────────────────────────────────

export async function getCostIntelligence(
  ventureId: string,
  days = 30,
): Promise<CostIntelligence> {
  const periodStart = daysAgo(days);
  const periodEnd = todayStr();

  if (!supabase) {
    return buildEmptyCostIntelligence(ventureId, periodStart, periodEnd);
  }

  // ── 1. Query routing_decisions ───────────────────────────────────────────
  const { data: routingRows } = await supabase
    .from('routing_decisions')
    .select('primary_rail, estimated_fee_total_fee, savings_vs_default, amount, created_at')
    .eq('venture_id', ventureId)
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd)
    .limit(50000);

  type RoutingRow = {
    primary_rail: string | null;
    estimated_fee_total_fee: number | null;
    savings_vs_default: number | null;
    amount: number | null;
  };

  const routing = (routingRows as RoutingRow[] | null) ?? [];

  // ── 2. Aggregate fee data ────────────────────────────────────────────────
  let totalProcessingFees = 0;
  let totalTransactionAmount = 0;
  let savingsFromSmartRouting = 0;
  const feesByProcessor: Record<string, number> = {};
  const feesByRail: Record<string, number> = {};

  let stripeCardCount = 0;
  let achAvailable = false;
  let cryptoEligibleOnCard = 0;

  for (const row of routing) {
    const fee = row.estimated_fee_total_fee ?? 0;
    const savings = row.savings_vs_default ?? 0;
    const amount = row.amount ?? 0;
    const rail = row.primary_rail ?? 'unknown';

    totalProcessingFees += fee;
    totalTransactionAmount += amount;
    savingsFromSmartRouting += savings;

    feesByProcessor[rail] = (feesByProcessor[rail] ?? 0) + fee;
    feesByRail[rail] = (feesByRail[rail] ?? 0) + fee;

    // Track for recommendation generation
    if (rail === 'stripe_card' || rail === 'card') stripeCardCount++;
    if (rail === 'ach' || rail === 'stripe_ach') achAvailable = true;
    if ((rail === 'stripe_card' || rail === 'card') && amount <= 1000) cryptoEligibleOnCard++;
  }

  // ── 3. Supplement with payment_intents if routing data is sparse ─────────
  if (routing.length < 10) {
    const { data: intentRows } = await supabase
      .from('payment_intents')
      .select('amount, fee_amount, payment_method_type, currency, created_at')
      .eq('venture_id', ventureId)
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd)
      .in('status', ['succeeded', 'captured'])
      .limit(50000);

    type IntentRow = {
      amount: number | null;
      fee_amount: number | null;
      payment_method_type: string | null;
    };

    for (const intent of (intentRows as IntentRow[] | null) ?? []) {
      const fee = intent.fee_amount ?? 0;
      const amount = intent.amount ?? 0;
      const method = intent.payment_method_type ?? 'unknown';

      totalProcessingFees += fee;
      totalTransactionAmount += amount;
      feesByProcessor[method] = (feesByProcessor[method] ?? 0) + fee;
      feesByRail[method] = (feesByRail[method] ?? 0) + fee;

      if (method === 'card' || method === 'stripe_card') stripeCardCount++;
    }
  }

  // ── 4. Calculate crypto savings (from crypto rails vs card baseline) ─────
  const cryptoFees = (feesByRail['solana'] ?? 0) + (feesByRail['usdc'] ?? 0) + (feesByRail['crypto'] ?? 0);
  const cryptoTransactionAmount = totalTransactionAmount * (cryptoFees / Math.max(totalProcessingFees, 1));
  // Estimated savings: crypto ~0.1% vs card ~2.9% + $0.30
  const savingsFromCryptoRails = cryptoTransactionAmount * (0.029 - 0.001);

  const avgFeePercentage = totalTransactionAmount > 0
    ? totalProcessingFees / totalTransactionAmount
    : 0;

  // ── 5. Monthly volume estimate ───────────────────────────────────────────
  const monthlyVolumeEstimate = (totalTransactionAmount / days) * 30;

  // ── 6. Small transaction count ───────────────────────────────────────────
  const { data: microRows } = await supabase
    .from('routing_decisions')
    .select('id')
    .eq('venture_id', ventureId)
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd)
    .lte('amount', 5)
    .limit(1000);

  const microCount = microRows?.length ?? 0;

  // ── 7. Generate recommendations ─────────────────────────────────────────
  const recommendations: CostRecommendation[] = [];
  let priority = 1;

  const totalTxCount = routing.length;
  const stripeCardPct = totalTxCount > 0 ? stripeCardCount / totalTxCount : 0;

  // Rec 1: Enable ACH if > 50% Stripe card and ACH not in use
  if (stripeCardPct > 0.5 && !achAvailable && totalTransactionAmount > 0) {
    const estimatedACHSavings = totalTransactionAmount * stripeCardPct * (0.029 - 0.008);
    recommendations.push({
      type: 'switch_rail',
      title: 'Enable ACH Direct Debit',
      description: `${Math.round(stripeCardPct * 100)}% of your transactions use Stripe card (2.9% + $0.30). ACH costs ~0.8% with a $5 cap — significant savings for larger transactions.`,
      estimatedMonthlySavings: (estimatedACHSavings / days) * 30,
      effort: 'low',
      ventureId,
      priority: priority++,
    });
  }

  // Rec 2: Enable Solana Pay for crypto-eligible transactions
  if (cryptoEligibleOnCard > 5) {
    const estimatedCryptoSavings = (cryptoEligibleOnCard / totalTxCount) * totalTransactionAmount * (0.029 - 0.001);
    recommendations.push({
      type: 'increase_crypto',
      title: 'Enable Solana Pay',
      description: `${cryptoEligibleOnCard} transactions were eligible for crypto rails but routed through card. Solana Pay charges <0.1% vs 2.9% for card.`,
      estimatedMonthlySavings: (estimatedCryptoSavings / days) * 30,
      effort: 'medium',
      ventureId,
      priority: priority++,
    });
  }

  // Rec 3: Negotiate volume rates if monthly volume > $50K
  if (monthlyVolumeEstimate > 50000) {
    recommendations.push({
      type: 'negotiate_rates',
      title: 'Negotiate Volume Rates',
      description: `Your estimated monthly volume of $${(monthlyVolumeEstimate / 1000).toFixed(0)}K qualifies for custom pricing. Stripe and PayPal offer reduced rates at this volume.`,
      estimatedMonthlySavings: monthlyVolumeEstimate * 0.003, // ~0.3% improvement typically achievable
      effort: 'medium',
      ventureId,
      priority: priority++,
    });
  }

  // Rec 4: Enable credit system for micropayments
  if (microCount > 20) {
    const micropaymentFeeCost = microCount * 0.30; // flat $0.30 fee per micro transaction
    recommendations.push({
      type: 'optimize_credits',
      title: 'Enable Credit System for Micropayments',
      description: `${microCount} transactions under $5 were processed through payment rails. A platform credit system eliminates per-transaction fees for micro purchases.`,
      estimatedMonthlySavings: (micropaymentFeeCost / days) * 30,
      effort: 'high',
      ventureId,
      priority: priority++,
    });
  }

  // Sort by estimated savings desc
  recommendations.sort((a, b) => b.estimatedMonthlySavings - a.estimatedMonthlySavings);
  // Re-assign priority after sort
  recommendations.forEach((r, i) => { r.priority = i + 1; });

  return {
    ventureId,
    periodStart,
    periodEnd,
    totalProcessingFees,
    feesByProcessor,
    feesByRail,
    avgFeePercentage,
    savingsFromSmartRouting,
    savingsFromCryptoRails,
    totalSavings: savingsFromSmartRouting + savingsFromCryptoRails,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────
// GENERATE COST SNAPSHOT (cron target)
// ─────────────────────────────────────────────────────────

export async function generateCostSnapshot(ventureId: string): Promise<void> {
  if (!supabase) return;

  const intelligence = await getCostIntelligence(ventureId, 30);

  await supabase.from('cost_snapshots').insert({
    venture_id: ventureId,
    period_start: intelligence.periodStart,
    period_end: intelligence.periodEnd,
    total_processing_fees: intelligence.totalProcessingFees,
    fees_by_processor: intelligence.feesByProcessor,
    fees_by_rail: intelligence.feesByRail,
    avg_fee_percentage: intelligence.avgFeePercentage,
    savings_from_smart_routing: intelligence.savingsFromSmartRouting,
    savings_from_crypto_rails: intelligence.savingsFromCryptoRails,
    total_savings: intelligence.totalSavings,
    recommendations: intelligence.recommendations,
    created_at: new Date().toISOString(),
  });
}

// ─────────────────────────────────────────────────────────
// EMPTY BUILDER
// ─────────────────────────────────────────────────────────

function buildEmptyCostIntelligence(
  ventureId: string,
  periodStart: string,
  periodEnd: string,
): CostIntelligence {
  return {
    ventureId,
    periodStart,
    periodEnd,
    totalProcessingFees: 0,
    feesByProcessor: {},
    feesByRail: {},
    avgFeePercentage: 0,
    savingsFromSmartRouting: 0,
    savingsFromCryptoRails: 0,
    totalSavings: 0,
    recommendations: [],
    generatedAt: new Date().toISOString(),
  };
}
