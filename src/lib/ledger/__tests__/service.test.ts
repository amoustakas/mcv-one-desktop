// src/lib/ledger/__tests__/service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAccount, getAccountByCode, listAccounts, provisionVentureAccounts } from '../service';
import { DEFAULT_CHART_OF_ACCOUNTS } from '../chart-of-accounts';

// Mock Supabase client
const mockFrom = vi.fn();

vi.mock('../../supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

describe('Ledger Service — Accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createAccount validates input with Zod', async () => {
    await expect(
      createAccount({ ventureId: '', code: '999', name: '', type: 'asset' as any, subtype: 'cash' as any, currency: 'USD' })
    ).rejects.toThrow();
  });

  it('createAccount calls supabase insert with correct shape', async () => {
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'test-id',
            venture_id: 'mcv',
            code: '1010',
            name: 'Test Cash',
            type: 'asset',
            subtype: 'cash',
            currency: 'USD',
            current_balance: 0,
            is_system: false,
            wallet_chain: null,
            wallet_address: null,
            wallet_provider: null,
            wallet_custody_type: null,
            wallet_last_synced_at: null,
            wallet_sync_strategy: null,
            metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      }),
    });
    mockFrom.mockReturnValue({ insert: insertMock });

    const result = await createAccount({
      ventureId: 'mcv',
      code: '1010',
      name: 'Test Cash',
      type: 'asset',
      subtype: 'cash',
      currency: 'USD',
    });

    expect(mockFrom).toHaveBeenCalledWith('ledger_accounts');
    expect(insertMock).toHaveBeenCalled();
    expect(result.code).toBe('1010');
  });

  it('provisionVentureAccounts creates all default accounts', async () => {
    const insertMock = vi.fn().mockResolvedValue({ data: [], error: null });
    mockFrom.mockReturnValue({ insert: insertMock });

    await provisionVentureAccounts('test-venture');

    expect(insertMock).toHaveBeenCalledTimes(1);
    const insertedRows = insertMock.mock.calls[0][0];
    expect(insertedRows.length).toBe(DEFAULT_CHART_OF_ACCOUNTS.length);
  });

  it('getAccountByCode returns null when not found (PGRST116)', async () => {
    const singleMock = vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'not found' },
    });
    const eqMock2 = vi.fn().mockReturnValue({ single: singleMock });
    const eqMock1 = vi.fn().mockReturnValue({ eq: eqMock2 });
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: eqMock1 }) });

    const result = await getAccountByCode('mcv', '9999');
    expect(result).toBeNull();
  });

  it('listAccounts returns mapped array', async () => {
    const row = {
      id: 'acc-1',
      venture_id: 'mcv',
      code: '1010',
      name: 'Cash',
      type: 'asset',
      subtype: 'cash',
      currency: 'USD',
      current_balance: 0,
      is_system: true,
      wallet_chain: null,
      wallet_address: null,
      wallet_provider: null,
      wallet_custody_type: null,
      wallet_last_synced_at: null,
      wallet_sync_strategy: null,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const orderMock = vi.fn().mockResolvedValue({ data: [row], error: null });
    const eqMock = vi.fn().mockReturnValue({ order: orderMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ select: selectMock });

    const result = await listAccounts('mcv');
    expect(result).toHaveLength(1);
    expect(result[0].ventureId).toBe('mcv');
    expect(result[0].code).toBe('1010');
  });
});
