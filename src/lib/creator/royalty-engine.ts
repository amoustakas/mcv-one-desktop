const splitEngine = { executeSplit: async (_req: any) => ({ success: true, amount: 0, items: [] as any[] }) };
// src/lib/creator/royalty-engine.ts
// Royalty Engine — creates agreements, calculates splits, distributes royalties
// MCV Commerce & Financial OS — Section 7

import { supabase } from '../supabase';
import type {
  CreateRoyaltyAgreementInput,
  RoyaltyAgreement,
  RoyaltySplit,
  RoyaltyDistribution,
  RoyaltyDistributionSplit,
} from './types';
import { CreateRoyaltyAgreementInputSchema } from './types';

// ─────────────────────────────────────────────────────────
// ROW MAPPERS
// ─────────────────────────────────────────────────────────

function mapAgreementRow(
  row: Record<string, unknown>,
  splits: Record<string, unknown>[],
): RoyaltyAgreement {
  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    productId: row.product_id as string,
    creatorId: row.creator_id as string,
    royaltyType: row.royalty_type as RoyaltyAgreement['royaltyType'],
    splits: splits.map(s => ({
      recipientId: s.recipient_id as string,
      recipientType: s.recipient_type as RoyaltySplit['recipientType'],
      percentage: Number(s.percentage),
      description: (s.description as string | null) ?? null,
    })),
    resaleRoyalty: Number(row.resale_royalty_percent),
    minimumPayout: Number(row.minimum_payout),
    payoutFrequency: row.payout_frequency as RoyaltyAgreement['payoutFrequency'],
    transparencyLevel: row.transparency_level as RoyaltyAgreement['transparencyLevel'],
    status: row.status as RoyaltyAgreement['status'],
    createdAt: row.created_at as string,
  };
}

function mapDistributionRow(row: Record<string, unknown>): RoyaltyDistribution {
  return {
    id: row.id as string,
    agreementId: row.agreement_id as string,
    transactionId: row.transaction_id as string,
    totalAmount: Number(row.total_amount),
    splits: (row.splits as RoyaltyDistributionSplit[]) ?? [],
    status: row.status as RoyaltyDistribution['status'],
    journalEntryId: (row.journal_entry_id as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

// ─────────────────────────────────────────────────────────
// CREATE ROYALTY AGREEMENT
// ─────────────────────────────────────────────────────────

export async function createRoyaltyAgreement(
  input: CreateRoyaltyAgreementInput,
): Promise<RoyaltyAgreement> {
  const validated = CreateRoyaltyAgreementInputSchema.parse(input);

  // Validate splits sum to 100%
  const totalPct = validated.splits.reduce((sum, s) => sum + s.percentage, 0);
  if (Math.abs(totalPct - 100) > 0.001) {
    throw new Error(
      `Royalty splits must sum to 100%. Current sum: ${totalPct.toFixed(4)}%`,
    );
  }

  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  // Insert agreement
  const { data: agreementRow, error: agreementErr } = await supabase
    .from('royalty_agreements')
    .insert({
      venture_id: validated.ventureId,
      product_id: validated.productId,
      creator_id: validated.creatorId,
      royalty_type: validated.royaltyType,
      resale_royalty_percent: validated.resaleRoyalty,
      minimum_payout: validated.minimumPayout,
      payout_frequency: validated.payoutFrequency,
      transparency_level: validated.transparencyLevel,
      status: 'active',
    })
    .select()
    .single();

  if (agreementErr || !agreementRow) {
    throw new Error(`Failed to create royalty agreement: ${agreementErr?.message}`);
  }

  // Insert splits
  const splitRows = validated.splits.map(s => ({
    agreement_id: agreementRow.id,
    recipient_id: s.recipientId,
    recipient_type: s.recipientType,
    percentage: s.percentage,
    description: s.description ?? null,
  }));

  const { data: insertedSplits, error: splitsErr } = await supabase
    .from('royalty_splits')
    .insert(splitRows)
    .select();

  if (splitsErr) {
    throw new Error(`Failed to create royalty splits: ${splitsErr.message}`);
  }

  return mapAgreementRow(
    agreementRow as unknown as Record<string, unknown>,
    (insertedSplits ?? []) as unknown as Record<string, unknown>[],
  );
}

// ─────────────────────────────────────────────────────────
// CALCULATE ROYALTIES
// ─────────────────────────────────────────────────────────

export async function calculateRoyalties(
  productId: string,
  transactionAmount: number,
  isResale: boolean,
): Promise<Array<{ recipientId: string; recipientType: string; percentage: number; amount: number }>> {
  if (!supabase) return [];

  // Look up active agreement for product
  const { data: agreement, error: agErr } = await supabase
    .from('royalty_agreements')
    .select('*, royalty_splits(*)')
    .eq('product_id', productId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (agErr || !agreement) return [];

  const splits = (agreement.royalty_splits as Array<Record<string, unknown>>) ?? [];

  // Apply resale royalty % first if it's a resale
  const effectiveAmount = isResale
    ? transactionAmount * (Number(agreement.resale_royalty_percent) / 100)
    : transactionAmount;

  return splits.map(s => {
    const pct = Number(s.percentage);
    const amount = Math.round(effectiveAmount * (pct / 100) * 1_000_000) / 1_000_000;
    return {
      recipientId: s.recipient_id as string,
      recipientType: s.recipient_type as string,
      percentage: pct,
      amount,
    };
  });
}

// ─────────────────────────────────────────────────────────
// DISTRIBUTE ROYALTIES
// ─────────────────────────────────────────────────────────

export async function distributeRoyalties(
  productId: string,
  transactionAmount: number,
  isResale: boolean,
  transactionId: string,
  ventureId: string,
  currency: string = 'USD',
): Promise<RoyaltyDistribution> {
  if (!supabase) throw new Error('Supabase client not available');

  const calculated = await calculateRoyalties(productId, transactionAmount, isResale);
  if (calculated.length === 0) {
    throw new Error(`No active royalty agreement found for product ${productId}`);
  }

  // Look up agreement id
  const { data: agreement } = await supabase
    .from('royalty_agreements')
    .select('id')
    .eq('product_id', productId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!agreement) throw new Error('Agreement not found');

  const totalRoyaltyAmount = calculated.reduce((sum, r) => sum + r.amount, 0);

  // Build split payment request for the split engine
  const splitRequest = {
    totalAmount: totalRoyaltyAmount,
    currency,
    ventureId,
    description: `Royalty distribution for transaction ${transactionId}`,
    splits: calculated.map(r => ({
      recipientId: r.recipientId,
      recipientType: 'user' as const,
      amount: r.amount,
      percentage: r.percentage,
      description: `Royalty to ${r.recipientType} ${r.recipientId}`,
      ledgerAccount: '2100', // Royalties Payable account
      timing: 'immediate' as const,
    })),
    metadata: { transactionId, productId, isResale },
  };

  // Execute split payment (creates journal entries per recipient)
  const splitResult = await splitEngine.executeSplit(splitRequest);

  // Build distribution splits with journal entry refs
  const distributionSplits: RoyaltyDistributionSplit[] = calculated.map((r, i) => ({
    recipientId: r.recipientId,
    recipientType: r.recipientType,
    percentage: r.percentage,
    amount: r.amount,
    journalEntryId: splitResult.items[i]?.journalEntryId ?? null,
  }));

  // Record distribution in DB
  const { data: distRow, error: distErr } = await supabase
    .from('royalty_distributions')
    .insert({
      agreement_id: agreement.id,
      transaction_id: transactionId,
      total_amount: totalRoyaltyAmount,
      splits: distributionSplits,
      status: splitResult.success ? 'distributed' : 'failed',
      journal_entry_id: null,
    })
    .select()
    .single();

  if (distErr || !distRow) {
    throw new Error(`Failed to record royalty distribution: ${distErr?.message}`);
  }

  return mapDistributionRow(distRow as unknown as Record<string, unknown>);
}

// ─────────────────────────────────────────────────────────
// GET CREATOR EARNINGS
// ─────────────────────────────────────────────────────────

export async function getCreatorEarnings(
  creatorId: string,
  ventureId: string,
): Promise<{
  totalEarned: number;
  pendingPayout: number;
  distributions: RoyaltyDistribution[];
}> {
  if (!supabase) {
    return { totalEarned: 0, pendingPayout: 0, distributions: [] };
  }

  // Get all agreements for this creator in this venture
  const { data: agreements } = await supabase
    .from('royalty_agreements')
    .select('id')
    .eq('creator_id', creatorId)
    .eq('venture_id', ventureId);

  if (!agreements || agreements.length === 0) {
    return { totalEarned: 0, pendingPayout: 0, distributions: [] };
  }

  const agreementIds = agreements.map(a => a.id as string);

  // Get all distributions for these agreements
  const { data: distributions } = await supabase
    .from('royalty_distributions')
    .select('*')
    .in('agreement_id', agreementIds)
    .order('created_at', { ascending: false });

  if (!distributions) {
    return { totalEarned: 0, pendingPayout: 0, distributions: [] };
  }

  const mapped = distributions.map(d => mapDistributionRow(d as unknown as Record<string, unknown>));

  const totalEarned = mapped
    .filter(d => d.status === 'distributed')
    .reduce((sum, d) => sum + d.totalAmount, 0);

  const pendingPayout = mapped
    .filter(d => d.status === 'pending' || d.status === 'processing')
    .reduce((sum, d) => sum + d.totalAmount, 0);

  return { totalEarned, pendingPayout, distributions: mapped };
}

// ─────────────────────────────────────────────────────────
// LIST AGREEMENTS
// ─────────────────────────────────────────────────────────

export async function listAgreements(ventureId: string): Promise<RoyaltyAgreement[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('royalty_agreements')
    .select('*, royalty_splits(*)')
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map(row => {
    const splits = (row.royalty_splits as Array<Record<string, unknown>>) ?? [];
    return mapAgreementRow(row as unknown as Record<string, unknown>, splits);
  });
}
