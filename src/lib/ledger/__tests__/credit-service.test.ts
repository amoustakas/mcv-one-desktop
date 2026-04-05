// src/lib/ledger/__tests__/credit-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { grantCredits, consumeCredits, getCreditBalance, createCreditAccount } from '../credit-service';

const mockFrom = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

// Mock the ledger service for journal entries
vi.mock('../service', () => ({
  createJournalEntry: vi.fn().mockResolvedValue({ id: 'je-1' }),
  postJournalEntry: vi.fn().mockResolvedValue({ id: 'je-1', status: 'posted' }),
  getAccountByCode: vi.fn().mockResolvedValue({ id: 'acct-2020' }),
}));

describe('Credit Service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('grantCredits rejects negative amounts', async () => {
    await expect(
      grantCredits({ ventureId: 'v1', ownerId: 'u1', amount: -10, reason: 'test' }),
    ).rejects.toThrow();
  });

  it('grantCredits rejects zero amounts', async () => {
    await expect(
      grantCredits({ ventureId: 'v1', ownerId: 'u1', amount: 0, reason: 'test' }),
    ).rejects.toThrow('Grant amount must be positive');
  });

  it('consumeCredits rejects amounts exceeding balance', async () => {
    // Mock: getCreditBalance returns balance = 50
    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'ca-1',
                venture_id: 'v1',
                owner_id: 'u1',
                owner_type: 'user',
                currency: 'credits',
                balance: 50,
                credit_limit: 0,
                total_granted: 100,
                total_consumed: 50,
                total_expired: 0,
                expires_at: null,
                metadata: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      }),
    });
    mockFrom.mockReturnValue({ select: selectMock });

    await expect(
      consumeCredits({ ventureId: 'v1', ownerId: 'u1', amount: 100, reason: 'purchase' }),
    ).rejects.toThrow('Insufficient credits');
  });

  it('consumeCredits rejects negative amounts', async () => {
    await expect(
      consumeCredits({ ventureId: 'v1', ownerId: 'u1', amount: -5, reason: 'test' }),
    ).rejects.toThrow('Consume amount must be positive');
  });

  it('createCreditAccount validates input with Zod', async () => {
    await expect(
      createCreditAccount({ ventureId: '', ownerId: '', ownerType: 'invalid' as any }),
    ).rejects.toThrow();
  });

  it('getCreditBalance throws when account not found', async () => {
    const singleMock = vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'account not found' },
    });
    const eqMock3 = vi.fn().mockReturnValue({ single: singleMock });
    const eqMock2 = vi.fn().mockReturnValue({ eq: eqMock3 });
    const eqMock1 = vi.fn().mockReturnValue({ eq: eqMock2 });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock1 });
    mockFrom.mockReturnValue({ select: selectMock });

    await expect(getCreditBalance('v1', 'unknown-user')).rejects.toThrow(
      'Credit account not found',
    );
  });
});
