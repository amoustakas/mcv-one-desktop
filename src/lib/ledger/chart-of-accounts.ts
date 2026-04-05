// src/lib/ledger/chart-of-accounts.ts

import type { AccountType, AccountSubtype } from './types';

export interface ChartOfAccountsEntry {
  code: string;
  name: string;
  type: AccountType;
  subtype: AccountSubtype;
  currency: string;
  isSystem: boolean;
}

export const DEFAULT_CHART_OF_ACCOUNTS: ChartOfAccountsEntry[] = [
  // ── ASSETS (1xxx) ──────────────────────────────────────
  { code: '1010', name: 'Cash - Stripe Balance',       type: 'asset', subtype: 'cash',          currency: 'USD', isSystem: true },
  { code: '1011', name: 'Cash - Bank (Primary)',        type: 'asset', subtype: 'bank',          currency: 'USD', isSystem: true },
  { code: '1012', name: 'Cash - Bank (Secondary)',      type: 'asset', subtype: 'bank',          currency: 'USD', isSystem: false },
  { code: '1013', name: 'Cash - PayPal Balance',        type: 'asset', subtype: 'cash',          currency: 'USD', isSystem: false },
  { code: '1014', name: 'Cash - Square Balance',        type: 'asset', subtype: 'cash',          currency: 'USD', isSystem: false },
  { code: '1020', name: 'Accounts Receivable',          type: 'asset', subtype: 'receivable',    currency: 'USD', isSystem: true },
  { code: '1025', name: 'Accounts Receivable - Invoiced', type: 'asset', subtype: 'receivable',  currency: 'USD', isSystem: true },
  { code: '1030', name: 'Inventory - Physical Goods',   type: 'asset', subtype: 'inventory',     currency: 'USD', isSystem: false },
  { code: '1040', name: 'Prepaid Expenses',             type: 'asset', subtype: 'prepaid',       currency: 'USD', isSystem: false },
  { code: '1050', name: 'Crypto - USDC Wallet',         type: 'asset', subtype: 'crypto_wallet', currency: 'USDC', isSystem: true },
  { code: '1051', name: 'Crypto - SOL Wallet',          type: 'asset', subtype: 'crypto_wallet', currency: 'SOL', isSystem: true },
  { code: '1052', name: 'Crypto - EDGE Wallet',         type: 'asset', subtype: 'crypto_wallet', currency: 'EDGE', isSystem: true },
  { code: '1055', name: 'Crypto - Exchange (Coinbase)', type: 'asset', subtype: 'exchange',      currency: 'USD', isSystem: false },
  { code: '1060', name: 'Platform Credits Receivable',  type: 'asset', subtype: 'receivable',    currency: 'USD', isSystem: true },
  { code: '1070', name: 'Loans Receivable - Short Term', type: 'asset', subtype: 'receivable',   currency: 'USD', isSystem: true },
  { code: '1071', name: 'Loans Receivable - Long Term', type: 'asset', subtype: 'receivable',    currency: 'USD', isSystem: false },
  { code: '1095', name: 'Escrow Holding',               type: 'asset', subtype: 'cash',          currency: 'USD', isSystem: true },

  // ── LIABILITIES (2xxx) ─────────────────────────────────
  { code: '2010', name: 'Accounts Payable',             type: 'liability', subtype: 'payable',           currency: 'USD', isSystem: true },
  { code: '2020', name: 'Credits Payable',              type: 'liability', subtype: 'credit_payable',    currency: 'USD', isSystem: true },
  { code: '2030', name: 'Unearned Revenue',             type: 'liability', subtype: 'unearned_revenue',  currency: 'USD', isSystem: true },
  { code: '2040', name: 'Loans Payable - Short Term',   type: 'liability', subtype: 'loan',              currency: 'USD', isSystem: false },
  { code: '2050', name: 'Platform Fees Payable',        type: 'liability', subtype: 'payable',           currency: 'USD', isSystem: true },
  { code: '2060', name: 'Tax Payable - Sales Tax',      type: 'liability', subtype: 'tax_payable',       currency: 'USD', isSystem: true },
  { code: '2070', name: 'Refunds Payable',              type: 'liability', subtype: 'payable',           currency: 'USD', isSystem: true },
  { code: '2080', name: 'Customer Deposits',            type: 'liability', subtype: 'payable',           currency: 'USD', isSystem: false },

  // ── EQUITY (3xxx) ──────────────────────────────────────
  { code: '3010', name: "Owner's Equity",               type: 'equity', subtype: 'equity',              currency: 'USD', isSystem: true },
  { code: '3020', name: 'Retained Earnings',            type: 'equity', subtype: 'retained_earnings',   currency: 'USD', isSystem: true },
  { code: '3030', name: 'Token Treasury',               type: 'equity', subtype: 'treasury',            currency: 'EDGE', isSystem: true },

  // ── REVENUE (4xxx) ─────────────────────────────────────
  { code: '4010', name: 'Revenue - Subscriptions',      type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4020', name: 'Revenue - One-Time Sales',     type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4030', name: 'Revenue - Digital Products',   type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4040', name: 'Revenue - Physical Goods',     type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4050', name: 'Revenue - Platform Fees',      type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4060', name: 'Revenue - Transaction Fees',   type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4070', name: 'Revenue - Credit Sales',       type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4080', name: 'Revenue - Interest (Loans)',   type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4090', name: 'Revenue - Yield Distributions', type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4100', name: 'Revenue - Marketplace Commissions', type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4110', name: 'Revenue - Services',           type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4120', name: 'Revenue - Metered Usage',      type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4130', name: 'Revenue - Royalties',          type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },

  // ── EXPENSES (5xxx) ────────────────────────────────────
  { code: '5010', name: 'COGS - Physical Goods',        type: 'expense', subtype: 'cogs',              currency: 'USD', isSystem: true },
  { code: '5020', name: 'COGS - Digital Delivery',      type: 'expense', subtype: 'cogs',              currency: 'USD', isSystem: true },
  { code: '5030', name: 'Payment Processing Fees',      type: 'expense', subtype: 'operating_expense', currency: 'USD', isSystem: true },
  { code: '5040', name: 'Refunds & Chargebacks',        type: 'expense', subtype: 'operating_expense', currency: 'USD', isSystem: true },
  { code: '5050', name: 'Credit Grants (Promotional)',  type: 'expense', subtype: 'operating_expense', currency: 'USD', isSystem: true },
  { code: '5060', name: 'Loan Write-offs',              type: 'expense', subtype: 'operating_expense', currency: 'USD', isSystem: true },
  { code: '5070', name: 'Infrastructure Costs',         type: 'expense', subtype: 'operating_expense', currency: 'USD', isSystem: false },
  { code: '5080', name: 'Third-Party Service Fees',     type: 'expense', subtype: 'operating_expense', currency: 'USD', isSystem: false },
  { code: '5090', name: 'FX Gains/Losses',              type: 'expense', subtype: 'other',             currency: 'USD', isSystem: true },
];

export function getAccountsByType(type: AccountType): ChartOfAccountsEntry[] {
  return DEFAULT_CHART_OF_ACCOUNTS.filter((a) => a.type === type);
}

export function getAccountByCode(code: string): ChartOfAccountsEntry | undefined {
  return DEFAULT_CHART_OF_ACCOUNTS.find((a) => a.code === code);
}
