// src/lib/ledger/index.ts

// Types
export type {
  LedgerAccount,
  JournalEntry,
  JournalEntryLine,
  JournalSourceType,
  JournalStatus,
  CreditAccount,
  FiscalYear,
  FiscalPeriod,
  AccountBalance,
  TrialBalanceRow,
  WalletBinding,
  LineDimensions,
  CreateAccountInput,
  CreateJournalEntryInput,
  CreateCreditAccountInput,
} from './types';

// Schemas (for validation in other modules)
export {
  LedgerAccountSchema,
  CreateAccountInput as CreateAccountInputSchema,
  CreateJournalEntryInput as CreateJournalEntryInputSchema,
  JournalEntryLineInput as JournalEntryLineInputSchema,
  AccountType,
  JournalSourceType as JournalSourceTypeEnum,
} from './types';

// Account operations
export {
  createAccount,
  getAccountByCode,
  listAccounts,
  provisionVentureAccounts,
} from './service';

// Journal entry operations
export {
  createJournalEntry,
  postJournalEntry,
  reverseJournalEntry,
  getJournalEntry,
  getTrialBalance,
} from './service';

// Credit operations
export {
  createCreditAccount,
  grantCredits,
  consumeCredits,
  getCreditBalance,
  transferCredits,
} from './credit-service';

// Chart of accounts
export {
  DEFAULT_CHART_OF_ACCOUNTS,
  getAccountsByType,
  getAccountByCode as getDefaultAccountByCode,
} from './chart-of-accounts';
