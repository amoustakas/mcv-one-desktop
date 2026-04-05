// src/lib/ledger/__tests__/chart-of-accounts.test.ts
import { describe, it, expect } from 'vitest';
import { DEFAULT_CHART_OF_ACCOUNTS, getAccountsByType } from '../chart-of-accounts';

describe('Chart of Accounts', () => {
  it('has at least one account per type', () => {
    const types = ['asset', 'liability', 'equity', 'revenue', 'expense'] as const;
    for (const type of types) {
      const accounts = getAccountsByType(type);
      expect(accounts.length).toBeGreaterThan(0);
    }
  });

  it('has unique codes across all accounts', () => {
    const codes = DEFAULT_CHART_OF_ACCOUNTS.map((a) => a.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('all codes are 4-digit strings', () => {
    for (const account of DEFAULT_CHART_OF_ACCOUNTS) {
      expect(account.code).toMatch(/^\d{4}$/);
    }
  });

  it('asset codes start with 1', () => {
    const assets = getAccountsByType('asset');
    for (const a of assets) {
      expect(a.code[0]).toBe('1');
    }
  });

  it('liability codes start with 2', () => {
    const liabilities = getAccountsByType('liability');
    for (const a of liabilities) {
      expect(a.code[0]).toBe('2');
    }
  });

  it('revenue codes start with 4', () => {
    const revenue = getAccountsByType('revenue');
    for (const a of revenue) {
      expect(a.code[0]).toBe('4');
    }
  });

  it('expense codes start with 5', () => {
    const expenses = getAccountsByType('expense');
    for (const a of expenses) {
      expect(a.code[0]).toBe('5');
    }
  });
});
