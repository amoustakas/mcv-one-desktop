// @mcv/capital-sdk/distributions-service — dividend/yield/interest/airdrop payout engine.
//
// Optional LedgerAdapter integration: if passed, every processed recipient
// posts a journal entry (DR Retained Earnings / CR Cash by default).
// Optional PaymentRouter integration: recipients can be paid via the
// shared payment router if registered.

import type { SupabaseClient } from '@supabase/supabase-js';

export type DistributionType =
  | 'dividend' | 'interest' | 'yield' | 'token_airdrop'
  | 'buyback' | 'return_of_capital' | 'fee_rebate' | 'other';

export type DistributionStatus =
  | 'scheduled' | 'processing' | 'partial' | 'completed' | 'failed' | 'cancelled';

export type RecipientStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'reversed';

export interface Distribution {
  id: string;
  ventureId: string;
  roundId: string | null;
  distributionType: DistributionType;
  status: DistributionStatus;
  scheduledFor: string | null;
  processedAt: string | null;
  completedAt: string | null;
  totalAmount: number;
  currency: string;
  totalRecipients: number;
  totalPaid: number;
  recordDate: string | null;
  exDate: string | null;
  journalEntryId: string | null;
  contentId: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DistributionRecipient {
  id: string;
  distributionId: string;
  contactId: string;
  commitmentId: string | null;
  amount: number;
  currency: string;
  amountUsd: number;
  paymentMethod: string | null;
  paymentReference: string | null;
  status: RecipientStatus;
  paidAt: string | null;
  taxWithheld: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDistributionInput {
  ventureId: string;
  roundId?: string | null;
  distributionType: DistributionType;
  totalAmount: number;
  currency?: string;
  scheduledFor?: string | null;
  recordDate?: string | null;
  exDate?: string | null;
  contentId?: string | null;
  notes?: string | null;
  createdBy?: string;
  metadata?: Record<string, unknown>;
  recipients?: Array<{
    contactId: string;
    commitmentId?: string | null;
    amount: number;
    currency?: string;
    amountUsd?: number;
    paymentMethod?: string;
    taxWithheld?: number;
  }>;
}

// Thin LedgerAdapter shape — structurally identical to @mcv/ledger-sdk/adapter.
// We redeclare here to avoid hard cross-SDK dep; callers pass a real LedgerAdapter
// and structural typing makes it work.
export interface LedgerAdapterLike {
  getAccountByCode(ventureId: string, code: string): Promise<{ id: string; code: string } | null>;
  createJournalEntry(input: {
    ventureId: string;
    date: string;
    memo: string;
    lines: Array<{ accountId: string; debit?: number; credit?: number; memo?: string }>;
    metadata?: Record<string, unknown>;
  }): Promise<{ id: string }>;
  postJournalEntry(entryId: string, postedBy: string): Promise<unknown>;
}

// Thin PaymentRouter shape — matches @mcv/payments-sdk/router processPayment signature.
export interface PaymentRouterLike {
  processPayment(request: {
    amount: number;
    currency: string;
    method: string;
    ventureId?: string;
    recipientContactId?: string;
    reference?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ result: { success: boolean; reference?: string; error?: string }; decision: unknown }>;
}

function mapDistributionRow(row: Record<string, unknown>): Distribution {
  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    roundId: (row.round_id as string) ?? null,
    distributionType: row.distribution_type as DistributionType,
    status: row.status as DistributionStatus,
    scheduledFor: (row.scheduled_for as string) ?? null,
    processedAt: (row.processed_at as string) ?? null,
    completedAt: (row.completed_at as string) ?? null,
    totalAmount: Number(row.total_amount),
    currency: row.currency as string,
    totalRecipients: Number(row.total_recipients ?? 0),
    totalPaid: Number(row.total_paid ?? 0),
    recordDate: (row.record_date as string) ?? null,
    exDate: (row.ex_date as string) ?? null,
    journalEntryId: (row.journal_entry_id as string) ?? null,
    contentId: (row.content_id as string) ?? null,
    notes: (row.notes as string) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdBy: (row.created_by as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapRecipientRow(row: Record<string, unknown>): DistributionRecipient {
  return {
    id: row.id as string,
    distributionId: row.distribution_id as string,
    contactId: row.contact_id as string,
    commitmentId: (row.commitment_id as string) ?? null,
    amount: Number(row.amount),
    currency: row.currency as string,
    amountUsd: Number(row.amount_usd),
    paymentMethod: (row.payment_method as string) ?? null,
    paymentReference: (row.payment_reference as string) ?? null,
    status: row.status as RecipientStatus,
    paidAt: (row.paid_at as string) ?? null,
    taxWithheld: Number(row.tax_withheld ?? 0),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export interface DistributionsService {
  createDistribution(input: CreateDistributionInput): Promise<Distribution>;
  listDistributions(ventureId: string, filters?: { roundId?: string; status?: DistributionStatus; limit?: number }): Promise<Distribution[]>;
  getDistribution(id: string): Promise<{ distribution: Distribution; recipients: DistributionRecipient[] } | null>;
  processDistribution(id: string, actorId?: string): Promise<Distribution>;
  cancelDistribution(id: string): Promise<Distribution>;
  listRecipientsByContact(contactId: string): Promise<DistributionRecipient[]>;
}

export interface DistributionsServiceOptions {
  supabase: SupabaseClient | null;
  /** Optional LedgerAdapter — when passed, posts journal entries on process. */
  ledger?: LedgerAdapterLike | null;
  /** Optional PaymentRouter — when passed, routes recipient payouts. */
  paymentRouter?: PaymentRouterLike | null;
  /** Account code used for the cash side of distribution JE. Default '1010'. */
  cashAccountCode?: string;
  /** Account code used for the debit side (equity/interest). Default '3900' (Retained Earnings). */
  sourceAccountCode?: string;
}

export function createDistributionsService({
  supabase,
  ledger,
  paymentRouter,
  cashAccountCode = '1010',
  sourceAccountCode = '3900',
}: DistributionsServiceOptions): DistributionsService {
  return {
    async createDistribution(input) {
      if (!supabase) throw new Error('Supabase client not available');
      const distRow = {
        venture_id: input.ventureId,
        round_id: input.roundId ?? null,
        distribution_type: input.distributionType,
        status: input.scheduledFor ? 'scheduled' : 'scheduled',
        total_amount: input.totalAmount,
        currency: input.currency ?? 'USD',
        scheduled_for: input.scheduledFor ?? null,
        record_date: input.recordDate ?? null,
        ex_date: input.exDate ?? null,
        content_id: input.contentId ?? null,
        notes: input.notes ?? null,
        created_by: input.createdBy ?? null,
        metadata: input.metadata ?? {},
      };
      const { data: dist, error } = await supabase
        .from('capital_distributions')
        .insert(distRow)
        .select()
        .single();
      if (error) throw new Error(`Failed to create distribution: ${error.message}`);

      if (input.recipients?.length) {
        const recipientRows = input.recipients.map((r) => ({
          distribution_id: dist.id,
          contact_id: r.contactId,
          commitment_id: r.commitmentId ?? null,
          amount: r.amount,
          currency: r.currency ?? input.currency ?? 'USD',
          amount_usd: r.amountUsd ?? r.amount,
          payment_method: r.paymentMethod ?? null,
          tax_withheld: r.taxWithheld ?? 0,
          status: 'pending',
        }));
        const { error: rErr } = await supabase.from('capital_distribution_recipients').insert(recipientRows);
        if (rErr) throw new Error(`Failed to insert recipients: ${rErr.message}`);
      }

      return mapDistributionRow(dist);
    },

    async listDistributions(ventureId, filters) {
      if (!supabase) return [];
      let q = supabase
        .from('capital_distributions')
        .select()
        .eq('venture_id', ventureId)
        .order('created_at', { ascending: false })
        .limit(filters?.limit ?? 50);
      if (filters?.roundId) q = q.eq('round_id', filters.roundId);
      if (filters?.status) q = q.eq('status', filters.status);
      const { data, error } = await q;
      if (error) throw new Error(`Failed to list distributions: ${error.message}`);
      return (data ?? []).map(mapDistributionRow);
    },

    async getDistribution(id) {
      if (!supabase) return null;
      const [distRes, recipRes] = await Promise.all([
        supabase.from('capital_distributions').select().eq('id', id).maybeSingle(),
        supabase.from('capital_distribution_recipients').select().eq('distribution_id', id),
      ]);
      if (!distRes.data) return null;
      return {
        distribution: mapDistributionRow(distRes.data),
        recipients: ((recipRes.data as Record<string, unknown>[]) ?? []).map(mapRecipientRow),
      };
    },

    async processDistribution(id, actorId) {
      if (!supabase) throw new Error('Supabase client not available');
      const state = await this.getDistribution(id);
      if (!state) throw new Error(`Distribution ${id} not found`);
      const { distribution, recipients } = state;
      if (distribution.status === 'completed') return distribution;
      if (distribution.status === 'cancelled') throw new Error('Distribution is cancelled');

      const now = new Date().toISOString();
      await supabase.from('capital_distributions').update({ status: 'processing', processed_at: now }).eq('id', id);

      // 1. Optional ledger posting — single JE covering the whole distribution
      let journalEntryId: string | null = null;
      if (ledger) {
        try {
          const [cashAcct, sourceAcct] = await Promise.all([
            ledger.getAccountByCode(distribution.ventureId, cashAccountCode),
            ledger.getAccountByCode(distribution.ventureId, sourceAccountCode),
          ]);
          if (cashAcct && sourceAcct) {
            const entry = await ledger.createJournalEntry({
              ventureId: distribution.ventureId,
              date: now,
              memo: `Distribution ${distribution.distributionType} ${distribution.id.slice(0, 8)}`,
              lines: [
                { accountId: sourceAcct.id, debit: distribution.totalAmount, memo: 'Distribution source' },
                { accountId: cashAcct.id, credit: distribution.totalAmount, memo: 'Cash out' },
              ],
              metadata: { distribution_id: distribution.id },
            });
            await ledger.postJournalEntry(entry.id, actorId ?? 'system');
            journalEntryId = entry.id;
            await supabase.from('capital_distributions').update({ journal_entry_id: entry.id }).eq('id', id);
          }
        } catch (err) {
          console.warn('[distributions] ledger posting failed, continuing:', err);
        }
      }

      // 2. Route recipient payouts via PaymentRouter if configured
      let succeeded = 0;
      let failed = 0;
      for (const r of recipients) {
        if (r.status !== 'pending') continue;
        if (paymentRouter && r.paymentMethod) {
          try {
            const { result } = await paymentRouter.processPayment({
              amount: r.amount,
              currency: r.currency,
              method: r.paymentMethod,
              ventureId: distribution.ventureId,
              recipientContactId: r.contactId,
              reference: `dist-${distribution.id.slice(0, 8)}-${r.contactId.slice(0, 8)}`,
              metadata: { distribution_id: distribution.id, recipient_id: r.id },
            });
            if (result.success) {
              await supabase
                .from('capital_distribution_recipients')
                .update({ status: 'paid', payment_reference: result.reference ?? null, paid_at: new Date().toISOString() })
                .eq('id', r.id);
              succeeded++;
            } else {
              await supabase
                .from('capital_distribution_recipients')
                .update({ status: 'failed', metadata: { ...r.metadata, error: result.error } })
                .eq('id', r.id);
              failed++;
            }
          } catch (err) {
            await supabase
              .from('capital_distribution_recipients')
              .update({ status: 'failed', metadata: { ...r.metadata, error: String(err) } })
              .eq('id', r.id);
            failed++;
          }
        } else {
          // No router — mark as paid optimistically (admin will reconcile)
          await supabase
            .from('capital_distribution_recipients')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .eq('id', r.id);
          succeeded++;
        }
      }

      // 3. Final status
      const finalStatus: DistributionStatus = failed > 0 && succeeded > 0 ? 'partial' : failed > 0 ? 'failed' : 'completed';
      const { data: finalRow } = await supabase
        .from('capital_distributions')
        .update({
          status: finalStatus,
          completed_at: finalStatus === 'completed' ? new Date().toISOString() : null,
          journal_entry_id: journalEntryId,
        })
        .eq('id', id)
        .select()
        .single();

      return finalRow ? mapDistributionRow(finalRow) : distribution;
    },

    async cancelDistribution(id) {
      if (!supabase) throw new Error('Supabase client not available');
      const { data, error } = await supabase
        .from('capital_distributions')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(`Failed to cancel distribution: ${error.message}`);
      return mapDistributionRow(data);
    },

    async listRecipientsByContact(contactId) {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('capital_distribution_recipients')
        .select()
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(`Failed to list recipients: ${error.message}`);
      return (data ?? []).map(mapRecipientRow);
    },
  };
}
