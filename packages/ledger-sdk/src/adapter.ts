// @mcv/ledger-sdk/adapter — minimal contract that ledger-coupled services
// (subscription, invoice, loan, checkout, gift-card, fulfillment in
// commerce-sdk; split-engine in payments-sdk) depend on.
//
// Kept deliberately loose — `LedgerAccountRef`/`LedgerJournalEntryRef` are
// the minimum projection (just `{id}`), and `postJournalEntry` returns
// `Promise<unknown>` — so consumers can plug in mocks, in-memory test
// doubles, or third-party ledger backends without materializing a full
// JournalEntry.
//
// LedgerService (./service) structurally satisfies this contract: its
// methods return the richer types `LedgerAccount` / `JournalEntry`, which
// are subtypes of the minimal projections here. Pass a LedgerService
// instance directly anywhere a LedgerAdapter is expected — no shim needed.

export interface LedgerAccountRef {
  id: string;
}

export interface LedgerJournalEntryRef {
  id: string;
}

export interface LedgerJournalEntryInput {
  ventureId: string;
  entryDate: string;
  description: string;
  sourceType: string;
  sourceId: string;
  lines: Array<{
    accountId: string;
    debitAmount: number;
    creditAmount: number;
    currency?: string;
    exchangeRate?: number;
    dimensions?: Record<string, string | undefined>;
  }>;
}

export interface LedgerAdapter {
  getAccountByCode(ventureId: string, code: string): Promise<LedgerAccountRef | null>;
  createJournalEntry(input: LedgerJournalEntryInput): Promise<LedgerJournalEntryRef>;
  postJournalEntry(entryId: string, postedBy: string): Promise<unknown>;
}
