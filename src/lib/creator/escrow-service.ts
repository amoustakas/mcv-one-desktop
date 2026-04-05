// src/lib/creator/escrow-service.ts
// Escrow Service — milestone-based fund holding and conditional release
// MCV Commerce & Financial OS — Section 8

import { supabase } from '../supabase';
import { createJournalEntry, postJournalEntry, getAccountByCode } from '../ledger/service';
import type {
  CreateEscrowAgreementInput,
  EscrowAgreement,
  EscrowMilestone,
} from './types';
import { CreateEscrowAgreementInputSchema } from './types';

// ─────────────────────────────────────────────────────────
// LEDGER ACCOUNT CODES
// ─────────────────────────────────────────────────────────

const ESCROW_ACCOUNT_CODE = '1095';  // Escrow Holdback (asset)
const CASH_ACCOUNT_CODE   = '1010';  // Cash / Clearing (asset)
const PLATFORM_FEE_CODE   = '4100';  // Platform Revenue (revenue)

// ─────────────────────────────────────────────────────────
// ROW MAPPERS
// ─────────────────────────────────────────────────────────

function mapMilestoneRow(row: Record<string, unknown>): EscrowMilestone {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    amount: Number(row.amount),
    status: row.status as EscrowMilestone['status'],
    dueDate: (row.due_date as string | null) ?? null,
    submittedAt: (row.submitted_at as string | null) ?? null,
    approvedAt: (row.approved_at as string | null) ?? null,
    evidence: (row.evidence as string[]) ?? [],
    createdAt: row.created_at as string,
  };
}

function mapEscrowRow(
  row: Record<string, unknown>,
  milestones: Record<string, unknown>[],
): EscrowAgreement {
  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    buyerId: row.buyer_id as string,
    sellerId: row.seller_id as string,
    amount: Number(row.amount),
    currency: row.currency as string,
    status: row.status as EscrowAgreement['status'],
    milestones: milestones.map(mapMilestoneRow),
    escrowAccountId: (row.escrow_account_id as string | null) ?? null,
    releaseCondition: row.release_condition as EscrowAgreement['releaseCondition'],
    expiresAt: (row.expires_at as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  };
}

// ─────────────────────────────────────────────────────────
// HELPER: fetch agreement + milestones
// ─────────────────────────────────────────────────────────

async function getEscrowWithMilestones(agreementId: string): Promise<EscrowAgreement | null> {
  if (!supabase) return null;

  const { data: agreement, error } = await supabase
    .from('escrow_agreements')
    .select('*, escrow_milestones(*)')
    .eq('id', agreementId)
    .single();

  if (error || !agreement) return null;

  const milestones = (agreement.escrow_milestones as Array<Record<string, unknown>>) ?? [];
  return mapEscrowRow(agreement as unknown as Record<string, unknown>, milestones);
}

// ─────────────────────────────────────────────────────────
// CREATE ESCROW AGREEMENT
// ─────────────────────────────────────────────────────────

export async function createEscrowAgreement(
  input: CreateEscrowAgreementInput,
): Promise<EscrowAgreement> {
  const validated = CreateEscrowAgreementInputSchema.parse(input);

  if (!supabase) throw new Error('Supabase client not available');

  // Validate milestone amounts don't exceed escrow amount (if milestones present)
  if (validated.milestones.length > 0) {
    const milestoneTotal = validated.milestones.reduce((sum, m) => sum + m.amount, 0);
    if (milestoneTotal > validated.amount + 0.001) {
      throw new Error(
        `Milestone total (${milestoneTotal}) exceeds escrow amount (${validated.amount})`,
      );
    }
  }

  const { data: agreementRow, error: agErr } = await supabase
    .from('escrow_agreements')
    .insert({
      venture_id: validated.ventureId,
      buyer_id: validated.buyerId,
      seller_id: validated.sellerId,
      amount: validated.amount,
      currency: validated.currency,
      status: 'pending_funding',
      release_condition: validated.releaseCondition,
      expires_at: validated.expiresAt ?? null,
      metadata: validated.metadata,
    })
    .select()
    .single();

  if (agErr || !agreementRow) {
    throw new Error(`Failed to create escrow agreement: ${agErr?.message}`);
  }

  // Insert milestones
  const insertedMilestones: Record<string, unknown>[] = [];
  if (validated.milestones.length > 0) {
    const milestoneRows = validated.milestones.map(m => ({
      agreement_id: agreementRow.id,
      name: m.name,
      description: m.description ?? null,
      amount: m.amount,
      status: 'pending',
      due_date: m.dueDate ?? null,
    }));

    const { data: ms, error: msErr } = await supabase
      .from('escrow_milestones')
      .insert(milestoneRows)
      .select();

    if (msErr) throw new Error(`Failed to create milestones: ${msErr.message}`);
    insertedMilestones.push(...((ms ?? []) as unknown as Record<string, unknown>[]));
  }

  return mapEscrowRow(
    agreementRow as unknown as Record<string, unknown>,
    insertedMilestones,
  );
}

// ─────────────────────────────────────────────────────────
// FUND ESCROW
// Journal: DR Escrow (1095), CR Cash (1010)
// ─────────────────────────────────────────────────────────

export async function fundEscrow(agreementId: string): Promise<EscrowAgreement> {
  if (!supabase) throw new Error('Supabase client not available');

  const escrow = await getEscrowWithMilestones(agreementId);
  if (!escrow) throw new Error(`Escrow agreement ${agreementId} not found`);
  if (escrow.status !== 'pending_funding') {
    throw new Error(`Escrow must be in 'pending_funding' status to fund. Current: ${escrow.status}`);
  }

  // Journal: DR Escrow (1095), CR Cash (1010)
  const escrowAccount = await getAccountByCode(escrow.ventureId, ESCROW_ACCOUNT_CODE);
  const cashAccount   = await getAccountByCode(escrow.ventureId, CASH_ACCOUNT_CODE);

  if (escrowAccount && cashAccount) {
    const entry = await createJournalEntry({
      ventureId: escrow.ventureId,
      entryDate: new Date().toISOString(),
      description: `Escrow funded for agreement ${agreementId}`,
      sourceType: 'escrow_hold',
      sourceId: agreementId,
      lines: [
        {
          accountId: escrowAccount.id,
          debitAmount: escrow.amount,
          creditAmount: 0,
          currency: escrow.currency,
          exchangeRate: 1,
          dimensions: {},
        },
        {
          accountId: cashAccount.id,
          debitAmount: 0,
          creditAmount: escrow.amount,
          currency: escrow.currency,
          exchangeRate: 1,
          dimensions: {},
        },
      ],
    });
    await postJournalEntry(entry.id);
  }

  // Update status to funded
  const { error: updateErr } = await supabase
    .from('escrow_agreements')
    .update({ status: 'funded', escrow_account_id: ESCROW_ACCOUNT_CODE })
    .eq('id', agreementId);

  if (updateErr) throw new Error(`Failed to update escrow status: ${updateErr.message}`);

  return (await getEscrowWithMilestones(agreementId))!;
}

// ─────────────────────────────────────────────────────────
// SUBMIT MILESTONE
// ─────────────────────────────────────────────────────────

export async function submitMilestone(
  agreementId: string,
  milestoneId: string,
  evidence: string[],
): Promise<EscrowAgreement> {
  if (!supabase) throw new Error('Supabase client not available');

  const { error } = await supabase
    .from('escrow_milestones')
    .update({
      status: 'submitted',
      evidence,
      submitted_at: new Date().toISOString(),
    })
    .eq('id', milestoneId)
    .eq('agreement_id', agreementId);

  if (error) throw new Error(`Failed to submit milestone: ${error.message}`);

  // Move agreement to in_progress if it was funded
  await supabase
    .from('escrow_agreements')
    .update({ status: 'in_progress' })
    .eq('id', agreementId)
    .eq('status', 'funded');

  return (await getEscrowWithMilestones(agreementId))!;
}

// ─────────────────────────────────────────────────────────
// APPROVE MILESTONE
// Journal: DR Escrow (1095) → release milestone amount to seller
// ─────────────────────────────────────────────────────────

export async function approveMilestone(
  agreementId: string,
  milestoneId: string,
): Promise<EscrowAgreement> {
  if (!supabase) throw new Error('Supabase client not available');

  const escrow = await getEscrowWithMilestones(agreementId);
  if (!escrow) throw new Error(`Escrow agreement ${agreementId} not found`);

  const milestone = escrow.milestones.find(m => m.id === milestoneId);
  if (!milestone) throw new Error(`Milestone ${milestoneId} not found`);
  if (milestone.status !== 'submitted') {
    throw new Error(`Milestone must be 'submitted' to approve. Current: ${milestone.status}`);
  }

  // Calculate platform fee (2.5% of milestone amount)
  const platformFeeRate = 0.025;
  const platformFee     = Math.round(milestone.amount * platformFeeRate * 1_000_000) / 1_000_000;
  const sellerAmount    = milestone.amount - platformFee;

  // Journal: DR Escrow release (CR Escrow 1095, DR Cash to seller)
  const escrowAccount    = await getAccountByCode(escrow.ventureId, ESCROW_ACCOUNT_CODE);
  const cashAccount      = await getAccountByCode(escrow.ventureId, CASH_ACCOUNT_CODE);
  const platformFeeAcct  = await getAccountByCode(escrow.ventureId, PLATFORM_FEE_CODE);

  if (escrowAccount && cashAccount) {
    const lines: Parameters<typeof createJournalEntry>[0]['lines'] = [
      {
        accountId: cashAccount.id,
        debitAmount: sellerAmount,
        creditAmount: 0,
        currency: escrow.currency,
        exchangeRate: 1,
        dimensions: { ventureId: escrow.ventureId },
      },
      {
        accountId: escrowAccount.id,
        debitAmount: 0,
        creditAmount: milestone.amount,
        currency: escrow.currency,
        exchangeRate: 1,
        dimensions: {},
      },
    ];

    // Add platform fee line if we have the account
    if (platformFeeAcct && platformFee > 0) {
      lines.push({
        accountId: platformFeeAcct.id,
        debitAmount: 0,
        creditAmount: platformFee,
        currency: escrow.currency,
        exchangeRate: 1,
        dimensions: { ventureId: escrow.ventureId },
      });
      // Debit adjustment to balance: platform fee comes from escrow too
      // Already included in CR Escrow above (milestone.amount = sellerAmount + platformFee)
    }

    const entry = await createJournalEntry({
      ventureId: escrow.ventureId,
      entryDate: new Date().toISOString(),
      description: `Escrow milestone approved: ${milestone.name}`,
      sourceType: 'escrow_release',
      sourceId: milestoneId,
      lines,
    });
    await postJournalEntry(entry.id);
  }

  // Update milestone status
  await supabase
    .from('escrow_milestones')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', milestoneId);

  // Check if all milestones are approved → move to pending_release
  const updated = await getEscrowWithMilestones(agreementId);
  if (updated && updated.milestones.length > 0) {
    const allApproved = updated.milestones.every(m => m.id === milestoneId ? true : m.status === 'approved');
    if (allApproved) {
      await supabase
        .from('escrow_agreements')
        .update({ status: 'pending_release' })
        .eq('id', agreementId);
    }
  }

  return (await getEscrowWithMilestones(agreementId))!;
}

// ─────────────────────────────────────────────────────────
// REJECT MILESTONE
// ─────────────────────────────────────────────────────────

export async function rejectMilestone(
  agreementId: string,
  milestoneId: string,
  reason: string,
): Promise<EscrowAgreement> {
  if (!supabase) throw new Error('Supabase client not available');

  const { error } = await supabase
    .from('escrow_milestones')
    .update({
      status: 'rejected',
      evidence: supabase
        ? undefined // preserve existing evidence; add reason to metadata via separate update
        : undefined,
    })
    .eq('id', milestoneId)
    .eq('agreement_id', agreementId);

  if (error) throw new Error(`Failed to reject milestone: ${error.message}`);

  // Log reason in escrow metadata
  const escrow = await getEscrowWithMilestones(agreementId);
  if (escrow) {
    const updatedMeta = {
      ...escrow.metadata,
      [`rejection_${milestoneId}`]: { reason, rejectedAt: new Date().toISOString() },
    };
    await supabase
      .from('escrow_agreements')
      .update({ metadata: updatedMeta })
      .eq('id', agreementId);
  }

  return (await getEscrowWithMilestones(agreementId))!;
}

// ─────────────────────────────────────────────────────────
// RELEASE ESCROW (full release of remaining funds)
// ─────────────────────────────────────────────────────────

export async function releaseEscrow(agreementId: string): Promise<EscrowAgreement> {
  if (!supabase) throw new Error('Supabase client not available');

  const escrow = await getEscrowWithMilestones(agreementId);
  if (!escrow) throw new Error(`Escrow agreement ${agreementId} not found`);
  if (!['funded', 'in_progress', 'pending_release'].includes(escrow.status)) {
    throw new Error(`Escrow cannot be released from status: ${escrow.status}`);
  }

  // Calculate remaining amount (total minus already-approved milestones)
  const approvedAmount = escrow.milestones
    .filter(m => m.status === 'approved')
    .reduce((sum, m) => sum + m.amount, 0);
  const remainingAmount = escrow.amount - approvedAmount;

  if (remainingAmount > 0) {
    const escrowAccount = await getAccountByCode(escrow.ventureId, ESCROW_ACCOUNT_CODE);
    const cashAccount   = await getAccountByCode(escrow.ventureId, CASH_ACCOUNT_CODE);

    if (escrowAccount && cashAccount) {
      const entry = await createJournalEntry({
        ventureId: escrow.ventureId,
        entryDate: new Date().toISOString(),
        description: `Full escrow release for agreement ${agreementId}`,
        sourceType: 'escrow_release',
        sourceId: agreementId,
        lines: [
          {
            accountId: cashAccount.id,
            debitAmount: remainingAmount,
            creditAmount: 0,
            currency: escrow.currency,
            exchangeRate: 1,
            dimensions: {},
          },
          {
            accountId: escrowAccount.id,
            debitAmount: 0,
            creditAmount: remainingAmount,
            currency: escrow.currency,
            exchangeRate: 1,
            dimensions: {},
          },
        ],
      });
      await postJournalEntry(entry.id);
    }
  }

  await supabase
    .from('escrow_agreements')
    .update({ status: 'released' })
    .eq('id', agreementId);

  return (await getEscrowWithMilestones(agreementId))!;
}

// ─────────────────────────────────────────────────────────
// DISPUTE ESCROW
// ─────────────────────────────────────────────────────────

export async function disputeEscrow(
  agreementId: string,
  reason: string,
): Promise<EscrowAgreement> {
  if (!supabase) throw new Error('Supabase client not available');

  const escrow = await getEscrowWithMilestones(agreementId);
  if (!escrow) throw new Error(`Escrow agreement ${agreementId} not found`);

  const updatedMeta = {
    ...escrow.metadata,
    dispute: { reason, disputedAt: new Date().toISOString() },
  };

  const { error } = await supabase
    .from('escrow_agreements')
    .update({ status: 'disputed', metadata: updatedMeta })
    .eq('id', agreementId);

  if (error) throw new Error(`Failed to dispute escrow: ${error.message}`);

  return (await getEscrowWithMilestones(agreementId))!;
}

// ─────────────────────────────────────────────────────────
// REFUND ESCROW
// Journal: DR Cash (buyer), CR Escrow (1095)
// ─────────────────────────────────────────────────────────

export async function refundEscrow(agreementId: string): Promise<EscrowAgreement> {
  if (!supabase) throw new Error('Supabase client not available');

  const escrow = await getEscrowWithMilestones(agreementId);
  if (!escrow) throw new Error(`Escrow agreement ${agreementId} not found`);
  if (!['funded', 'in_progress', 'disputed', 'pending_funding'].includes(escrow.status)) {
    throw new Error(`Escrow cannot be refunded from status: ${escrow.status}`);
  }

  // Calculate refundable amount (total minus approved milestones)
  const approvedAmount = escrow.milestones
    .filter(m => m.status === 'approved')
    .reduce((sum, m) => sum + m.amount, 0);
  const refundAmount = escrow.amount - approvedAmount;

  if (refundAmount > 0) {
    const escrowAccount = await getAccountByCode(escrow.ventureId, ESCROW_ACCOUNT_CODE);
    const cashAccount   = await getAccountByCode(escrow.ventureId, CASH_ACCOUNT_CODE);

    if (escrowAccount && cashAccount) {
      const entry = await createJournalEntry({
        ventureId: escrow.ventureId,
        entryDate: new Date().toISOString(),
        description: `Escrow refund to buyer for agreement ${agreementId}`,
        sourceType: 'escrow_release',
        sourceId: agreementId,
        lines: [
          {
            accountId: cashAccount.id,
            debitAmount: refundAmount,
            creditAmount: 0,
            currency: escrow.currency,
            exchangeRate: 1,
            dimensions: { customerId: escrow.buyerId },
          },
          {
            accountId: escrowAccount.id,
            debitAmount: 0,
            creditAmount: refundAmount,
            currency: escrow.currency,
            exchangeRate: 1,
            dimensions: {},
          },
        ],
      });
      await postJournalEntry(entry.id);
    }
  }

  await supabase
    .from('escrow_agreements')
    .update({ status: 'refunded' })
    .eq('id', agreementId);

  return (await getEscrowWithMilestones(agreementId))!;
}
