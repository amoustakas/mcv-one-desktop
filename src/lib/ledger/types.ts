// src/lib/ledger/types.ts

import { z } from 'zod';

// ─────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────

export const AccountType = z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']);
export type AccountType = z.infer<typeof AccountType>;

export const AccountSubtype = z.enum([
  'cash', 'crypto_wallet', 'exchange', 'bank', 'receivable', 'inventory',
  'prepaid', 'equipment', 'investment', 'payable', 'unearned_revenue',
  'tax_payable', 'credit_payable', 'loan', 'equity', 'retained_earnings',
  'treasury', 'revenue', 'cogs', 'operating_expense', 'other',
]);
export type AccountSubtype = z.infer<typeof AccountSubtype>;

export const JournalStatus = z.enum(['draft', 'posted', 'reversed']);
export type JournalStatus = z.infer<typeof JournalStatus>;

export const JournalSourceType = z.enum([
  'payment', 'refund', 'credit_grant', 'credit_consume', 'subscription',
  'invoice', 'loan_disburse', 'loan_repayment', 'overage', 'transfer',
  'yield', 'platform_fee', 'payout', 'tax_remittance', 'wallet_sync',
  'swap', 'royalty', 'escrow_hold', 'escrow_release', 'manual',
]);
export type JournalSourceType = z.infer<typeof JournalSourceType>;

export const CustodyType = z.enum(['self', 'custodial', 'embedded', 'exchange', 'bank']);
export type CustodyType = z.infer<typeof CustodyType>;

export const SyncStrategy = z.enum(['realtime', 'polling', 'webhook', 'manual']);
export type SyncStrategy = z.infer<typeof SyncStrategy>;

export const CreditOwnerType = z.enum(['user', 'organization', 'venture']);
export type CreditOwnerType = z.infer<typeof CreditOwnerType>;

export const FiscalPeriodStatus = z.enum(['open', 'closed', 'locked']);
export type FiscalPeriodStatus = z.infer<typeof FiscalPeriodStatus>;

// ─────────────────────────────────────────────────────────
// WALLET BINDING
// ─────────────────────────────────────────────────────────

export const WalletBindingSchema = z.object({
  chain: z.enum(['solana', 'ethereum', 'bitcoin']).nullable(),
  address: z.string().nullable(),
  provider: z.string().nullable(),
  custodyType: CustodyType,
  lastSyncedAt: z.string().datetime().nullable(),
  syncStrategy: SyncStrategy,
});
export type WalletBinding = z.infer<typeof WalletBindingSchema>;

// ─────────────────────────────────────────────────────────
// LEDGER ACCOUNT
// ─────────────────────────────────────────────────────────

export const LedgerAccountSchema = z.object({
  id: z.string().uuid(),
  ventureId: z.string(),
  code: z.string().regex(/^\d{4}$/),
  name: z.string().min(1).max(200),
  type: AccountType,
  subtype: AccountSubtype,
  currency: z.string().min(2).max(10),
  currentBalance: z.number(),
  isSystem: z.boolean(),
  wallet: WalletBindingSchema.nullable(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type LedgerAccount = z.infer<typeof LedgerAccountSchema>;

export const CreateAccountInput = z.object({
  ventureId: z.string(),
  code: z.string().regex(/^\d{4}$/),
  name: z.string().min(1).max(200),
  type: AccountType,
  subtype: AccountSubtype,
  currency: z.string().min(2).max(10).default('USD'),
  isSystem: z.boolean().default(false),
  wallet: WalletBindingSchema.nullable().default(null),
  metadata: z.record(z.unknown()).default({}),
});
export type CreateAccountInput = z.infer<typeof CreateAccountInput>;

// ─────────────────────────────────────────────────────────
// JOURNAL ENTRY LINE (dimensions)
// ─────────────────────────────────────────────────────────

export const LineDimensionsSchema = z.object({
  ventureId: z.string().optional(),
  productId: z.string().optional(),
  customerId: z.string().optional(),
  departmentId: z.string().optional(),
  projectId: z.string().optional(),
  rail: z.string().optional(),
  taxJurisdiction: z.string().optional(),
});
export type LineDimensions = z.infer<typeof LineDimensionsSchema>;

export const JournalEntryLineInput = z.object({
  accountId: z.string().uuid(),
  debitAmount: z.number().min(0),
  creditAmount: z.number().min(0),
  currency: z.string().min(2).max(10).default('USD'),
  exchangeRate: z.number().positive().default(1),
  dimensions: LineDimensionsSchema.default({}),
}).refine(
  (line) => (line.debitAmount > 0) !== (line.creditAmount > 0),
  { message: 'Each line must have either a debit OR credit amount, not both or neither' }
);
export type JournalEntryLineInput = z.infer<typeof JournalEntryLineInput>;

// ─────────────────────────────────────────────────────────
// JOURNAL ENTRY
// ─────────────────────────────────────────────────────────

export const CreateJournalEntryInput = z.object({
  ventureId: z.string(),
  entryDate: z.string().datetime(),
  description: z.string().min(1).max(500),
  sourceType: JournalSourceType,
  sourceId: z.string(),
  lines: z.array(JournalEntryLineInput).min(2),
}).refine(
  (entry) => {
    const totalDebits = entry.lines.reduce((sum, l) => sum + l.debitAmount, 0);
    const totalCredits = entry.lines.reduce((sum, l) => sum + l.creditAmount, 0);
    return Math.abs(totalDebits - totalCredits) < 0.001;
  },
  { message: 'Journal entry must balance: total debits must equal total credits' }
);
export type CreateJournalEntryInput = z.infer<typeof CreateJournalEntryInput>;

export interface JournalEntry {
  id: string;
  ventureId: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  sourceType: JournalSourceType;
  sourceId: string;
  status: JournalStatus;
  lines: JournalEntryLine[];
  postedAt: string | null;
  postedBy: string | null;
  reversalOf: string | null;
  createdAt: string;
}

export interface JournalEntryLine {
  id: string;
  entryId: string;
  accountId: string;
  lineNumber: number;
  debitAmount: number;
  creditAmount: number;
  currency: string;
  exchangeRate: number;
  dimensions: LineDimensions;
}

// ─────────────────────────────────────────────────────────
// CREDIT ACCOUNT
// ─────────────────────────────────────────────────────────

export const CreateCreditAccountInput = z.object({
  ventureId: z.string(),
  ownerId: z.string(),
  ownerType: CreditOwnerType,
  currency: z.string().default('credits'),
  creditLimit: z.number().min(0).default(0),
  expiresAt: z.string().datetime().nullable().default(null),
  metadata: z.record(z.unknown()).default({}),
});
export type CreateCreditAccountInput = z.infer<typeof CreateCreditAccountInput>;

export interface CreditAccount {
  id: string;
  ventureId: string;
  ownerId: string;
  ownerType: CreditOwnerType;
  currency: string;
  balance: number;
  creditLimit: number;
  totalGranted: number;
  totalConsumed: number;
  totalExpired: number;
  expiresAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────
// FISCAL PERIODS
// ─────────────────────────────────────────────────────────

export interface FiscalYear {
  id: string;
  ventureId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: FiscalPeriodStatus;
  isCurrent: boolean;
}

export interface FiscalPeriod {
  id: string;
  fiscalYearId: string;
  periodNumber: number;
  periodName: string;
  startDate: string;
  endDate: string;
  status: FiscalPeriodStatus;
}

export interface AccountBalance {
  id: string;
  accountId: string;
  periodId: string;
  openingBalance: number;
  debits: number;
  credits: number;
  closingBalance: number;
  currency: string;
}

// ─────────────────────────────────────────────────────────
// TRIAL BALANCE
// ─────────────────────────────────────────────────────────

export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debitBalance: number;
  creditBalance: number;
  currency: string;
}
