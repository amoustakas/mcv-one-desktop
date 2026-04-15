// src/stores/creator.ts
// Zustand store — Creator Economy (royalties, escrow, transactions)

import { create } from 'zustand';
import type {
  RoyaltyAgreement,
  EscrowAgreement,
  TransactionRecord,
  TransactionSearchFilters,
} from '../lib/creator/types';

// ─────────────────────────────────────────────────────────
// STATE TYPES
// ─────────────────────────────────────────────────────────

interface CreatorState {
  // Royalty Agreements
  royaltyAgreements: RoyaltyAgreement[];
  royaltyAgreementsLoading: boolean;

  // Escrow Agreements
  escrowAgreements: EscrowAgreement[];
  escrowAgreementsLoading: boolean;

  // Transactions
  transactions: TransactionRecord[];
  transactionsLoading: boolean;
  transactionsTotal: number;

  // Actions — Royalties
  fetchRoyaltyAgreements: (ventureId: string) => Promise<void>;
  createRoyaltyAgreement: (ventureId: string, input: Record<string, unknown>) => Promise<RoyaltyAgreement>;
  updateRoyaltyAgreement: (ventureId: string, input: Record<string, unknown>) => Promise<RoyaltyAgreement | null>;
  distributeRoyalties: (ventureId: string, productId: string, transactionAmount: number, isResale: boolean, transactionId: string) => Promise<unknown>;
  getCreatorEarnings: (ventureId: string, creatorId: string) => Promise<{ totalEarned: number; pendingPayout: number; distributions: unknown[] }>;

  // Actions — Escrow
  fetchEscrowAgreements: (ventureId: string) => Promise<void>;
  createEscrowAgreement: (ventureId: string, input: Record<string, unknown>) => Promise<EscrowAgreement>;
  updateEscrowAgreement: (ventureId: string, input: Record<string, unknown>) => Promise<EscrowAgreement | null>;
  fundEscrow: (ventureId: string, agreementId: string) => Promise<EscrowAgreement>;
  submitMilestone: (ventureId: string, agreementId: string, milestoneId: string, evidence: string[]) => Promise<EscrowAgreement>;
  approveMilestone: (ventureId: string, agreementId: string, milestoneId: string) => Promise<EscrowAgreement>;
  disputeMilestone: (ventureId: string, agreementId: string, milestoneId: string, reason: string) => Promise<EscrowAgreement>;
  releaseEscrow: (ventureId: string, agreementId: string) => Promise<EscrowAgreement>;

  // Actions — Transactions
  fetchTransactions: (ventureId: string, limit?: number, offset?: number) => Promise<void>;
  searchTransactions: (ventureId: string, filters: Partial<TransactionSearchFilters>) => Promise<TransactionRecord[]>;
  getTransaction: (ventureId: string, id: string) => Promise<TransactionRecord | null>;
}

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

const API_BASE = '/api/creator';

async function apiGet<T>(
  action: string,
  params: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const query = new URLSearchParams({ action });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v) !== '') {
      query.set(k, String(v));
    }
  }
  const res = await fetch(`${API_BASE}?${query.toString()}`);
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(e.error ?? `Creator API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function apiPost<T>(
  action: string,
  ventureId: string,
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ventureId, ...body }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(e.error ?? `Creator API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function mapRoyaltyRow(row: Record<string, unknown>): RoyaltyAgreement {
  const splits = (row.royalty_splits as Array<Record<string, unknown>>) ?? [];
  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    productId: row.product_id as string,
    creatorId: row.creator_id as string,
    royaltyType: row.royalty_type as RoyaltyAgreement['royaltyType'],
    splits: splits.map(s => ({
      recipientId: s.recipient_id as string,
      recipientType: s.recipient_type as RoyaltyAgreement['splits'][0]['recipientType'],
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

function mapEscrowRow(row: Record<string, unknown>): EscrowAgreement {
  const milestones = (row.escrow_milestones as Array<Record<string, unknown>>) ?? [];
  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    buyerId: row.buyer_id as string,
    sellerId: row.seller_id as string,
    amount: Number(row.amount),
    currency: row.currency as string,
    status: row.status as EscrowAgreement['status'],
    milestones: milestones.map(m => ({
      id: m.id as string,
      name: m.name as string,
      description: (m.description as string | null) ?? null,
      amount: Number(m.amount),
      status: m.status as EscrowAgreement['milestones'][0]['status'],
      dueDate: (m.due_date as string | null) ?? null,
      submittedAt: (m.submitted_at as string | null) ?? null,
      approvedAt: (m.approved_at as string | null) ?? null,
      evidence: (m.evidence as string[]) ?? [],
      createdAt: m.created_at as string,
      // metadata holds dispute_reason + disputed_at — surfaced by
      // EscrowDetailDialog as a banner under disputed milestones.
      metadata: (m.metadata as Record<string, unknown> | null) ?? undefined,
    })),
    escrowAccountId: (row.escrow_account_id as string | null) ?? null,
    releaseCondition: row.release_condition as EscrowAgreement['releaseCondition'],
    expiresAt: (row.expires_at as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  };
}

// ─────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────

export const useCreatorStore = create<CreatorState>((set) => ({
  royaltyAgreements: [],
  royaltyAgreementsLoading: false,
  escrowAgreements: [],
  escrowAgreementsLoading: false,
  transactions: [],
  transactionsLoading: false,
  transactionsTotal: 0,

  // ── Royalties ──────────────────────────────────────────

  fetchRoyaltyAgreements: async (ventureId) => {
    set({ royaltyAgreementsLoading: true });
    try {
      const { data } = await apiGet<{ data: Record<string, unknown>[] }>(
        'list-agreements', { ventureId }
      );
      set({ royaltyAgreements: (data ?? []).map(mapRoyaltyRow) });
    } finally {
      set({ royaltyAgreementsLoading: false });
    }
  },

  createRoyaltyAgreement: async (ventureId, input) => {
    const { data } = await apiPost<{ data: Record<string, unknown> }>(
      'create-agreement', ventureId, input
    );
    const mapped = mapRoyaltyRow(data);
    set((state) => ({ royaltyAgreements: [mapped, ...state.royaltyAgreements] }));
    return mapped;
  },

  updateRoyaltyAgreement: async (ventureId, input) => {
    try {
      const { data } = await apiPost<{ data: Record<string, unknown> }>(
        'update-agreement', ventureId, input
      );
      const mapped = mapRoyaltyRow(data);
      set((state) => ({
        royaltyAgreements: state.royaltyAgreements.map((r) => r.id === mapped.id ? mapped : r),
      }));
      return mapped;
    } catch {
      return null;
    }
  },

  distributeRoyalties: async (ventureId, productId, transactionAmount, isResale, transactionId) => {
    const { data } = await apiPost<{ data: unknown }>(
      'distribute-royalties', ventureId,
      { productId, transactionAmount, isResale, transactionId }
    );
    return data;
  },

  getCreatorEarnings: async (ventureId, creatorId) => {
    const { data } = await apiGet<{ data: { totalEarned: number; pendingPayout: number; distributions: unknown[] } }>(
      'get-earnings', { ventureId, creatorId }
    );
    return data;
  },

  // ── Escrow ────────────────────────────────────────────

  fetchEscrowAgreements: async (ventureId) => {
    set({ escrowAgreementsLoading: true });
    try {
      const { data } = await apiGet<{ data: Record<string, unknown>[] }>(
        'list-escrows', { ventureId }
      );
      set({ escrowAgreements: (data ?? []).map(mapEscrowRow) });
    } finally {
      set({ escrowAgreementsLoading: false });
    }
  },

  createEscrowAgreement: async (ventureId, input) => {
    const { data } = await apiPost<{ data: Record<string, unknown> }>(
      'create-escrow', ventureId, input
    );
    const mapped = mapEscrowRow(data);
    set((state) => ({ escrowAgreements: [mapped, ...state.escrowAgreements] }));
    return mapped;
  },

  updateEscrowAgreement: async (ventureId, input) => {
    try {
      const { data } = await apiPost<{ data: Record<string, unknown> }>(
        'update-escrow', ventureId, input
      );
      const mapped = mapEscrowRow(data);
      set((state) => ({
        escrowAgreements: state.escrowAgreements.map((e) => e.id === mapped.id ? mapped : e),
      }));
      return mapped;
    } catch {
      return null;
    }
  },

  fundEscrow: async (ventureId, agreementId) => {
    const { data } = await apiPost<{ data: Record<string, unknown> }>(
      'fund-escrow', ventureId, { agreementId }
    );
    const mapped = mapEscrowRow(data);
    set((state) => ({
      escrowAgreements: state.escrowAgreements.map(e => e.id === mapped.id ? mapped : e),
    }));
    return mapped;
  },

  submitMilestone: async (ventureId, agreementId, milestoneId, evidence) => {
    const { data } = await apiPost<{ data: Record<string, unknown> }>(
      'submit-milestone', ventureId, { agreementId, milestoneId, evidence }
    );
    const mapped = mapEscrowRow(data);
    set((state) => ({
      escrowAgreements: state.escrowAgreements.map(e => e.id === mapped.id ? mapped : e),
    }));
    return mapped;
  },

  approveMilestone: async (ventureId, agreementId, milestoneId) => {
    const { data } = await apiPost<{ data: Record<string, unknown> }>(
      'approve-milestone', ventureId, { agreementId, milestoneId }
    );
    const mapped = mapEscrowRow(data);
    set((state) => ({
      escrowAgreements: state.escrowAgreements.map(e => e.id === mapped.id ? mapped : e),
    }));
    return mapped;
  },

  disputeMilestone: async (ventureId, agreementId, milestoneId, reason) => {
    const { data } = await apiPost<{ data: Record<string, unknown> }>(
      'dispute-milestone', ventureId, { agreementId, milestoneId, reason }
    );
    const mapped = mapEscrowRow(data);
    set((state) => ({
      escrowAgreements: state.escrowAgreements.map(e => e.id === mapped.id ? mapped : e),
    }));
    return mapped;
  },

  releaseEscrow: async (ventureId, agreementId) => {
    const { data } = await apiPost<{ data: Record<string, unknown> }>(
      'release-escrow', ventureId, { agreementId }
    );
    const mapped = mapEscrowRow(data);
    set((state) => ({
      escrowAgreements: state.escrowAgreements.map(e => e.id === mapped.id ? mapped : e),
    }));
    return mapped;
  },

  // ── Transactions ──────────────────────────────────────

  fetchTransactions: async (ventureId, limit = 50, offset = 0) => {
    set({ transactionsLoading: true });
    try {
      const { data, meta } = await apiGet<{ data: TransactionRecord[]; meta: { total: number } }>(
        'list-transactions', { ventureId, limit, offset }
      );
      set({
        transactions: data ?? [],
        transactionsTotal: meta?.total ?? 0,
      });
    } finally {
      set({ transactionsLoading: false });
    }
  },

  searchTransactions: async (ventureId, filters) => {
    const { data } = await apiPost<{ data: TransactionRecord[] }>(
      'search-transactions', ventureId, filters as Record<string, unknown>
    );
    return data ?? [];
  },

  getTransaction: async (ventureId, id) => {
    try {
      const { data } = await apiGet<{ data: TransactionRecord }>(
        'get-transaction', { ventureId, id }
      );
      return data ?? null;
    } catch {
      return null;
    }
  },
}));
