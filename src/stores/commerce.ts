// src/stores/commerce.ts
// Zustand store — Commerce (products, subscriptions, invoices, loans)

import { create } from 'zustand';
import type {
  Product,
  Subscription,
  Invoice,
  Loan,
  ProductType,
  ProductStatus,
  SubscriptionStatus,
  InvoiceStatus,
  LoanStatus,
} from '../lib/commerce/types';

// ─────────────────────────────────────────────────────────
// STATE TYPES
// ─────────────────────────────────────────────────────────

interface CommerceState {
  // Products
  products: Product[];
  productsLoading: boolean;

  // Subscriptions
  subscriptions: Subscription[];
  subscriptionsLoading: boolean;

  // Invoices
  invoices: Invoice[];
  invoicesLoading: boolean;

  // Loans
  loans: Loan[];
  loansLoading: boolean;

  // Actions — Products
  fetchProducts: (ventureId: string, type?: ProductType, status?: ProductStatus) => Promise<void>;
  searchProducts: (ventureId: string, query: string) => Promise<Product[]>;
  createProduct: (ventureId: string, input: Record<string, unknown>) => Promise<Product>;

  // Actions — Subscriptions
  fetchSubscriptions: (ventureId: string, status?: SubscriptionStatus, customerId?: string) => Promise<void>;
  createSubscription: (ventureId: string, input: Record<string, unknown>) => Promise<Subscription>;
  cancelSubscription: (ventureId: string, subscriptionId: string, immediate?: boolean) => Promise<void>;
  recordUsage: (ventureId: string, subscriptionId: string, meterId: string, quantity: number, idempotencyKey: string) => Promise<void>;

  // Actions — Invoices
  fetchInvoices: (ventureId: string, status?: InvoiceStatus, customerId?: string) => Promise<void>;
  createInvoice: (ventureId: string, input: Record<string, unknown>) => Promise<Invoice>;
  sendInvoice: (ventureId: string, invoiceId: string) => Promise<void>;
  recordInvoicePayment: (ventureId: string, invoiceId: string, amount: number) => Promise<void>;
  voidInvoice: (ventureId: string, invoiceId: string) => Promise<void>;
  fetchOverdueInvoices: (ventureId: string) => Promise<Invoice[]>;

  // Actions — Loans
  fetchLoans: (ventureId: string, status?: LoanStatus) => Promise<void>;
  createLoan: (ventureId: string, input: Record<string, unknown>) => Promise<Loan>;
  disburseLoan: (ventureId: string, loanId: string) => Promise<void>;
  recordRepayment: (ventureId: string, loanId: string, amount: number) => Promise<void>;

  // Derived
  getProductsByType: (type: ProductType) => Product[];
  getActiveSubscriptions: () => Subscription[];
  getOverdueInvoices: () => Invoice[];
  getActiveLoans: () => Loan[];
}

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

const API_BASE = '/api/commerce';

async function apiGet<T>(action: string, params: Record<string, string | number | undefined>): Promise<T> {
  const query = new URLSearchParams({ action });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v) !== '') {
      query.set(k, String(v));
    }
  }
  const res = await fetch(`${API_BASE}?${query.toString()}`);
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(e.error ?? `Commerce API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function post<T>(action: string, ventureId: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ventureId, ...body }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(e.error ?? `Commerce API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────

export const useCommerceStore = create<CommerceState>((set, _get) => ({
  products: [],
  productsLoading: false,
  subscriptions: [],
  subscriptionsLoading: false,
  invoices: [],
  invoicesLoading: false,
  loans: [],
  loansLoading: false,

  // ── Products ────────────────────────────────────────────

  fetchProducts: async (ventureId, type, status) => {
    set({ productsLoading: true });
    try {
      const { data } = await apiGet<{ data: Product[] }>('list-products', { ventureId, type, status });
      set({ products: data ?? [] });
    } finally {
      set({ productsLoading: false });
    }
  },

  searchProducts: async (ventureId, query) => {
    const { data } = await apiGet<{ data: Product[] }>('search-products', { ventureId, query });
    return data ?? [];
  },

  createProduct: async (ventureId, input) => {
    const { data } = await post<{ data: Product }>('create-product', ventureId, input);
    set((state) => ({ products: [data, ...state.products] }));
    return data;
  },

  // ── Subscriptions ────────────────────────────────────────

  fetchSubscriptions: async (ventureId, status, customerId) => {
    set({ subscriptionsLoading: true });
    try {
      const { data } = await apiGet<{ data: Subscription[] }>('list-subscriptions', { ventureId, status, customerId });
      set({ subscriptions: data ?? [] });
    } finally {
      set({ subscriptionsLoading: false });
    }
  },

  createSubscription: async (ventureId, input) => {
    const { data } = await post<{ data: Subscription }>('create-subscription', ventureId, input);
    set((state) => ({ subscriptions: [data, ...state.subscriptions] }));
    return data;
  },

  cancelSubscription: async (ventureId, subscriptionId, immediate = false) => {
    await post('cancel-subscription', ventureId, { subscriptionId, immediate });
    set((state) => ({
      subscriptions: state.subscriptions.map((s: any) =>
        s.id === subscriptionId
          ? { ...s, status: immediate ? 'canceled' : s.status, cancelAtPeriodEnd: !immediate }
          : s,
      ),
    }));
  },

  recordUsage: async (ventureId, subscriptionId, meterId, quantity, idempotencyKey) => {
    await post('record-usage', ventureId, { subscriptionId, meterId, quantity, idempotencyKey });
  },

  // ── Invoices ────────────────────────────────────────────

  fetchInvoices: async (ventureId, status, customerId) => {
    set({ invoicesLoading: true });
    try {
      const { data } = await apiGet<{ data: Invoice[] }>('list-invoices', { ventureId, status, customerId });
      set({ invoices: data ?? [] });
    } finally {
      set({ invoicesLoading: false });
    }
  },

  createInvoice: async (ventureId, input) => {
    const { data } = await post<{ data: Invoice }>('create-invoice', ventureId, input);
    set((state) => ({ invoices: [data, ...state.invoices] }));
    return data;
  },

  sendInvoice: async (ventureId, invoiceId) => {
    await post('send-invoice', ventureId, { invoiceId });
    set((state) => ({
      invoices: state.invoices.map((inv: any) =>
        inv.id === invoiceId ? { ...inv, status: 'sent' } : inv,
      ),
    }));
  },

  recordInvoicePayment: async (ventureId, invoiceId, amount) => {
    const { data } = await post<{ data: Invoice }>('record-invoice-payment', ventureId, { invoiceId, amount });
    set((state) => ({
      invoices: state.invoices.map((inv: any) => (inv.id === invoiceId ? data : inv)),
    }));
  },

  voidInvoice: async (ventureId, invoiceId) => {
    const { data } = await post<{ data: Invoice }>('void-invoice', ventureId, { invoiceId });
    set((state) => ({
      invoices: state.invoices.map((inv: any) => (inv.id === invoiceId ? data : inv)),
    }));
  },

  fetchOverdueInvoices: async (ventureId) => {
    const { data } = await apiGet<{ data: Invoice[] }>('get-overdue', { ventureId });
    return data ?? [];
  },

  // ── Loans ────────────────────────────────────────────────

  fetchLoans: async (ventureId, status) => {
    set({ loansLoading: true });
    try {
      const { data } = await apiGet<{ data: Loan[] }>('list-loans', { ventureId, status });
      set({ loans: data ?? [] });
    } finally {
      set({ loansLoading: false });
    }
  },

  createLoan: async (ventureId, input) => {
    const { data } = await post<{ data: Loan }>('create-loan', ventureId, input);
    set((state) => ({ loans: [data, ...state.loans] }));
    return data;
  },

  disburseLoan: async (ventureId, loanId) => {
    const { data } = await post<{ data: Loan }>('disburse-loan', ventureId, { loanId });
    set((state) => ({
      loans: state.loans.map((l: any) => (l.id === loanId ? data : l)),
    }));
  },

  recordRepayment: async (ventureId, loanId, amount) => {
    const { data } = await post<{ data: Loan }>('record-repayment', ventureId, { loanId, amount });
    set((state) => ({
      loans: state.loans.map((l: any) => (l.id === loanId ? data : l)),
    }));
  },

  // ── Derived ──────────────────────────────────────────────

  getProductsByType: (type) => {
    return _get().products.filter((p: any) => p.type === type);
  },

  getActiveSubscriptions: () => {
    return _get().subscriptions.filter((s: any) =>
      s.status === 'active' || s.status === 'trialing',
    );
  },

  getOverdueInvoices: () => {
    const today = new Date().toISOString().split('T')[0];
    return _get().invoices.filter(
      (inv: any) =>
        (inv.status === 'sent' || inv.status === 'viewed' || inv.status === 'partial') &&
        inv.dueDate < today,
    );
  },

  getActiveLoans: () => {
    return _get().loans.filter((l: any) =>
      l.status === 'disbursed' || l.status === 'repaying',
    );
  },
}));
