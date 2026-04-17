// Contract tests for investor-flow hooks.
// Verifies:
//   - Query hooks send correct `action` with snake_case body fields.
//   - Mutation hooks translate every camelCase input to snake_case wire body.
//   - `useRoundDetail` is disabled when neither identifier is supplied.
//   - No camelCase keys leak onto the wire across any mutation.
//
// Follows the T3.8 / T4.4 / T5.3 pattern: mock `apiPost` + `@tanstack/react-query`
// to isolate the pure serialization contract without React or a QueryClientProvider.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock apiPost to capture call args without hitting the network.
vi.mock('../../lib/api/client', () => ({
  apiPost: vi.fn(async () => ({})),
}));

// Mock @tanstack/react-query: useQuery returns a shim that exposes the queryFn,
// useMutation exposes the raw mutationFn as mutateAsync/mutate, useQueryClient
// returns a no-op invalidateQueries spy.
vi.mock('@tanstack/react-query', () => ({
  useQuery: (opts: {
    queryFn: () => Promise<unknown>;
    enabled?: boolean;
    queryKey: unknown[];
    staleTime?: number;
  }) => {
    const enabled = opts.enabled !== false;
    return {
      queryKey: opts.queryKey,
      enabled,
      staleTime: opts.staleTime,
      invoke: enabled ? opts.queryFn : undefined,
    };
  },
  useMutation: (opts: {
    mutationFn: (v: unknown) => Promise<unknown>;
    onSuccess?: () => void;
  }) => ({
    mutateAsync: opts.mutationFn,
    mutate: opts.mutationFn,
    onSuccess: opts.onSuccess,
  }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

import { apiPost } from '../../lib/api/client';
import {
  usePublicRounds,
  useRoundDetail,
  useSubmitAccreditation,
  useCreateSoftCommit,
  useKickoffPayment,
} from '../use-investor-flow';

const mockedApiPost = apiPost as unknown as ReturnType<typeof vi.fn>;

describe('use-investor-flow — query hooks', () => {
  beforeEach(() => {
    mockedApiPost.mockClear();
    mockedApiPost.mockResolvedValue({});
  });

  it('usePublicRounds sends action=list_public_rounds with no other body fields', async () => {
    mockedApiPost.mockResolvedValueOnce({ rounds: [] });
    const q = usePublicRounds() as unknown as {
      invoke: () => Promise<unknown>;
      queryKey: unknown[];
    };
    await q.invoke();

    expect(mockedApiPost).toHaveBeenCalledTimes(1);
    const [path, body] = mockedApiPost.mock.calls[0] as [string, Record<string, unknown>];
    expect(path).toBe('/api/investor-flow');
    expect(body).toEqual({ action: 'list_public_rounds' });
    expect(q.queryKey).toEqual(['investor-flow', 'public-rounds']);
  });

  it('useRoundDetail({ roundId }) sends action=get_round_detail with round_id', async () => {
    mockedApiPost.mockResolvedValueOnce({ round: null });
    const q = useRoundDetail({ roundId: 'abc-123' }) as unknown as {
      invoke: () => Promise<unknown>;
      enabled: boolean;
      queryKey: unknown[];
    };
    expect(q.enabled).toBe(true);
    await q.invoke();

    expect(mockedApiPost).toHaveBeenCalledTimes(1);
    const [path, body] = mockedApiPost.mock.calls[0] as [string, Record<string, unknown>];
    expect(path).toBe('/api/investor-flow');
    expect(body.action).toBe('get_round_detail');
    expect(body.round_id).toBe('abc-123');
    expect(body.public_page_slug).toBeUndefined();
    // No camelCase leakage
    expect(body).not.toHaveProperty('roundId');
    expect(body).not.toHaveProperty('publicPageSlug');
    expect(q.queryKey).toEqual(['investor-flow', 'round', 'abc-123']);
  });

  it('useRoundDetail({ publicPageSlug }) sends public_page_slug (snake_case)', async () => {
    mockedApiPost.mockResolvedValueOnce({ round: null });
    const q = useRoundDetail({ publicPageSlug: 'futurestate-seed-1' }) as unknown as {
      invoke: () => Promise<unknown>;
      enabled: boolean;
    };
    expect(q.enabled).toBe(true);
    await q.invoke();

    const [, body] = mockedApiPost.mock.calls[0] as [string, Record<string, unknown>];
    expect(body.public_page_slug).toBe('futurestate-seed-1');
    expect(body.round_id).toBeUndefined();
    expect(body).not.toHaveProperty('publicPageSlug');
  });

  it('useRoundDetail is disabled when neither roundId nor publicPageSlug provided', () => {
    const q = useRoundDetail({}) as unknown as {
      invoke?: () => Promise<unknown>;
      enabled: boolean;
    };
    expect(q.enabled).toBe(false);
    expect(q.invoke).toBeUndefined();
    expect(mockedApiPost).not.toHaveBeenCalled();
  });
});

describe('use-investor-flow — useSubmitAccreditation', () => {
  beforeEach(() => {
    mockedApiPost.mockClear();
    mockedApiPost.mockResolvedValue({ profile: { id: 'prof-1' }, estimated_review_hours: 48 });
  });

  it('translates every camelCase input field to snake_case on the wire', async () => {
    const mutation = useSubmitAccreditation();
    await mutation.mutateAsync({
      contactId: 'contact-1',
      ventureId: 'venture-1',
      accreditationMethod: 'cpa_letter',
      jurisdiction: 'US',
      documents: [
        { type: 'cpa_letter', url: 'https://cdn/doc.pdf', uploadedAt: '2026-04-17T00:00:00Z' },
      ],
      organizationId: 'org-1',
      walletAddress: '0xabc',
      walletChain: 'solana',
      actorUserId: 'user-1',
    });

    expect(mockedApiPost).toHaveBeenCalledTimes(1);
    const [path, body] = mockedApiPost.mock.calls[0] as [string, Record<string, unknown>];
    expect(path).toBe('/api/investor-flow');
    expect(body.action).toBe('submit_accreditation');
    expect(body.contact_id).toBe('contact-1');
    expect(body.venture_id).toBe('venture-1');
    expect(body.accreditation_method).toBe('cpa_letter');
    expect(body.jurisdiction).toBe('US');
    expect(body.organization_id).toBe('org-1');
    expect(body.wallet_address).toBe('0xabc');
    expect(body.wallet_chain).toBe('solana');
    expect(body.actor_user_id).toBe('user-1');
  });

  it('translates documents[].uploadedAt → documents[].uploaded_at', async () => {
    const mutation = useSubmitAccreditation();
    await mutation.mutateAsync({
      contactId: 'contact-1',
      ventureId: 'venture-1',
      accreditationMethod: 'self_attestation',
      jurisdiction: 'CA',
      documents: [
        { type: 'id', url: 'https://a/1.pdf', uploadedAt: '2026-04-17T00:00:00Z' },
        { type: 'proof', url: 'https://a/2.pdf', uploadedAt: '2026-04-17T01:00:00Z' },
      ],
    });

    const [, body] = mockedApiPost.mock.calls[0] as [string, Record<string, unknown>];
    const docs = body.documents as Array<Record<string, unknown>>;
    expect(Array.isArray(docs)).toBe(true);
    expect(docs).toHaveLength(2);
    expect(docs[0]).toEqual({
      type: 'id',
      url: 'https://a/1.pdf',
      uploaded_at: '2026-04-17T00:00:00Z',
    });
    expect(docs[1]).toEqual({
      type: 'proof',
      url: 'https://a/2.pdf',
      uploaded_at: '2026-04-17T01:00:00Z',
    });
    // Ensure no camelCase leak on nested object
    expect(docs[0]).not.toHaveProperty('uploadedAt');
    expect(docs[1]).not.toHaveProperty('uploadedAt');
  });

  it('does not leak camelCase keys onto the wire', async () => {
    const mutation = useSubmitAccreditation();
    await mutation.mutateAsync({
      contactId: 'c',
      ventureId: 'v',
      accreditationMethod: 'income',
      jurisdiction: 'US',
      organizationId: 'o',
      walletAddress: '0x',
      walletChain: 'eth',
      actorUserId: 'u',
    });
    const [, body] = mockedApiPost.mock.calls[0] as [string, Record<string, unknown>];
    expect('contactId' in body).toBe(false);
    expect('ventureId' in body).toBe(false);
    expect('accreditationMethod' in body).toBe(false);
    expect('organizationId' in body).toBe(false);
    expect('walletAddress' in body).toBe(false);
    expect('walletChain' in body).toBe(false);
    expect('actorUserId' in body).toBe(false);
  });
});

describe('use-investor-flow — useCreateSoftCommit', () => {
  beforeEach(() => {
    mockedApiPost.mockClear();
    mockedApiPost.mockResolvedValue({
      commitment: {
        id: 'cmt-1',
        venture_id: 'venture-1',
        contact_id: 'contact-1',
        round_id: 'round-1',
        status: 'soft',
        amount: 50000,
        amount_usd: 50000,
        currency: 'USD',
      },
    });
  });

  it('translates every camelCase field to snake_case and passes amount/currency through', async () => {
    const mutation = useCreateSoftCommit();
    await mutation.mutateAsync({
      contactId: 'contact-1',
      roundId: 'round-1',
      amount: 50_000,
      currency: 'USD',
      paymentMethod: 'wire',
      walletAddress: '0xfeed',
      walletChain: 'solana',
      notes: 'soft commit via marketplace',
      source: 'marketplace',
      referralContactId: 'contact-99',
      actorUserId: 'user-1',
    });

    expect(mockedApiPost).toHaveBeenCalledTimes(1);
    const [path, body] = mockedApiPost.mock.calls[0] as [string, Record<string, unknown>];
    expect(path).toBe('/api/investor-flow');
    expect(body.action).toBe('create_soft_commit');
    expect(body.contact_id).toBe('contact-1');
    expect(body.round_id).toBe('round-1');
    expect(body.amount).toBe(50_000);
    expect(body.currency).toBe('USD');
    expect(body.payment_method).toBe('wire');
    expect(body.wallet_address).toBe('0xfeed');
    expect(body.wallet_chain).toBe('solana');
    expect(body.notes).toBe('soft commit via marketplace');
    expect(body.source).toBe('marketplace');
    expect(body.referral_contact_id).toBe('contact-99');
    expect(body.actor_user_id).toBe('user-1');
  });

  it('does not leak camelCase keys onto the wire', async () => {
    const mutation = useCreateSoftCommit();
    await mutation.mutateAsync({
      contactId: 'c',
      roundId: 'r',
      amount: 1000,
      paymentMethod: 'stripe',
      walletAddress: '0x',
      walletChain: 'eth',
      referralContactId: 'rc',
      actorUserId: 'u',
    });
    const [, body] = mockedApiPost.mock.calls[0] as [string, Record<string, unknown>];
    expect('contactId' in body).toBe(false);
    expect('roundId' in body).toBe(false);
    expect('paymentMethod' in body).toBe(false);
    expect('walletAddress' in body).toBe(false);
    expect('walletChain' in body).toBe(false);
    expect('referralContactId' in body).toBe(false);
    expect('actorUserId' in body).toBe(false);
  });

  it('returns { commitment } passthrough from apiPost', async () => {
    const mutation = useCreateSoftCommit();
    const result = await mutation.mutateAsync({
      contactId: 'contact-1',
      roundId: 'round-1',
      amount: 50_000,
    });
    expect(result).toHaveProperty('commitment');
    expect((result as { commitment: { id: string } }).commitment.id).toBe('cmt-1');
  });
});

describe('use-investor-flow — useKickoffPayment', () => {
  beforeEach(() => {
    mockedApiPost.mockClear();
    mockedApiPost.mockResolvedValue({
      payment_intent: {
        id: 'pi-1',
        status: 'pending',
        processor_id: 'pi_stripe_1',
        amount: 50_000,
      },
    });
  });

  it('translates commitmentId/paymentMethod/actorUserId to snake_case', async () => {
    const mutation = useKickoffPayment();
    await mutation.mutateAsync({
      commitmentId: 'cmt-1',
      paymentMethod: 'stripe_card',
      actorUserId: 'user-1',
    });

    expect(mockedApiPost).toHaveBeenCalledTimes(1);
    const [path, body] = mockedApiPost.mock.calls[0] as [string, Record<string, unknown>];
    expect(path).toBe('/api/investor-flow');
    expect(body.action).toBe('kickoff_payment');
    expect(body.commitment_id).toBe('cmt-1');
    expect(body.payment_method).toBe('stripe_card');
    expect(body.actor_user_id).toBe('user-1');
  });

  it('does not leak camelCase keys onto the wire', async () => {
    const mutation = useKickoffPayment();
    await mutation.mutateAsync({
      commitmentId: 'cmt-1',
      paymentMethod: 'wire',
      actorUserId: 'user-1',
    });
    const [, body] = mockedApiPost.mock.calls[0] as [string, Record<string, unknown>];
    expect('commitmentId' in body).toBe(false);
    expect('paymentMethod' in body).toBe(false);
    expect('actorUserId' in body).toBe(false);
  });
});
