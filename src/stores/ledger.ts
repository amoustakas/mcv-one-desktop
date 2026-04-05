import { create } from 'zustand';
import type { LedgerAccount, JournalEntry, TrialBalanceRow, CreditAccount } from '@/lib/ledger/types';

interface LedgerState {
  // Accounts
  accounts: LedgerAccount[];
  accountsLoading: boolean;

  // Journal entries
  entries: JournalEntry[];
  entriesLoading: boolean;

  // Trial balance
  trialBalance: TrialBalanceRow[];
  trialBalanceLoading: boolean;

  // Credit accounts
  creditAccounts: Map<string, CreditAccount>;

  // Actions
  fetchAccounts: (ventureId: string) => Promise<void>;
  fetchEntries: (ventureId: string) => Promise<void>;
  fetchTrialBalance: (ventureId: string) => Promise<void>;
  provisionAccounts: (ventureId: string) => Promise<void>;
  createEntry: (ventureId: string, entry: {
    entryDate: string;
    description: string;
    sourceType: string;
    sourceId: string;
    lines: Array<{ accountId: string; debitAmount: number; creditAmount: number }>;
  }) => Promise<void>;
  postEntry: (ventureId: string, entryId: string) => Promise<void>;

  // Derived
  getAccountByCode: (code: string) => LedgerAccount | undefined;
  getTotalAssets: () => number;
  getTotalLiabilities: () => number;
  getTotalEquity: () => number;
}

const API_BASE = '/api/ledger';

export const useLedgerStore = create<LedgerState>((set, get) => ({
  accounts: [],
  accountsLoading: false,
  entries: [],
  entriesLoading: false,
  trialBalance: [],
  trialBalanceLoading: false,
  creditAccounts: new Map(),

  fetchAccounts: async (ventureId) => {
    set({ accountsLoading: true });
    try {
      const res = await fetch(`${API_BASE}?action=list-accounts&ventureId=${ventureId}`);
      const { data } = await res.json();
      set({ accounts: data ?? [] });
    } finally {
      set({ accountsLoading: false });
    }
  },

  fetchEntries: async (ventureId) => {
    set({ entriesLoading: true });
    try {
      const res = await fetch(`${API_BASE}?action=list-entries&ventureId=${ventureId}`);
      const { data } = await res.json();
      set({ entries: data ?? [] });
    } finally {
      set({ entriesLoading: false });
    }
  },

  fetchTrialBalance: async (ventureId) => {
    set({ trialBalanceLoading: true });
    try {
      const res = await fetch(`${API_BASE}?action=get-trial-balance&ventureId=${ventureId}`);
      const { data } = await res.json();
      set({ trialBalance: data ?? [] });
    } finally {
      set({ trialBalanceLoading: false });
    }
  },

  provisionAccounts: async (ventureId) => {
    await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'provision-accounts', ventureId }),
    });
    await get().fetchAccounts(ventureId);
  },

  createEntry: async (ventureId, entry) => {
    await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create-entry', ventureId, ...entry }),
    });
    await get().fetchEntries(ventureId);
  },

  postEntry: async (ventureId, entryId) => {
    await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'post-entry', ventureId, entryId }),
    });
    await get().fetchEntries(ventureId);
    await get().fetchTrialBalance(ventureId);
  },

  getAccountByCode: (code) => {
    return get().accounts.find((a) => a.code === code);
  },

  getTotalAssets: () => {
    return get().trialBalance
      .filter((r) => r.accountType === 'asset')
      .reduce((sum, r) => sum + r.debitBalance - r.creditBalance, 0);
  },

  getTotalLiabilities: () => {
    return get().trialBalance
      .filter((r) => r.accountType === 'liability')
      .reduce((sum, r) => sum + r.creditBalance - r.debitBalance, 0);
  },

  getTotalEquity: () => {
    return get().trialBalance
      .filter((r) => r.accountType === 'equity')
      .reduce((sum, r) => sum + r.creditBalance - r.debitBalance, 0);
  },
}));
