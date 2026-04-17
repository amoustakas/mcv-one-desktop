// Pure-logic contract test for useCreateOperatorProspect.mutationFn.
// Verifies:
//   - Action name uses underscores (create_operator_prospect).
//   - camelCase input is translated to snake_case body.
//   - Response shape is passed through as { profile, journey }.
//
// The hook is a React Query mutation, but the mutationFn itself is pure
// (takes input, calls apiPost, returns result). We test the translation
// by capturing the apiPost call and asserting the serialized body.
//
// Environment constraint: vitest runs with `environment: 'node'` and the
// include glob only picks up `.test.ts` files under `src/**/__tests__/**`.
// So we deliberately avoid `@testing-library/react` and any JSX rendering;
// we mock React Query's `useMutation` to return the raw mutationFn instead.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the apiPost helper used inside use-prospects.ts to capture the request body.
// Signature matches src/lib/api/client.ts: apiPost<T>(endpoint, body).
const apiPostMock = vi.fn(async (..._args: unknown[]) => ({
  profile: { id: 'p1' },
  journey: { id: 'j1' },
}));

vi.mock('../../lib/api/client', () => ({
  apiPost: (...args: unknown[]) => apiPostMock(...args),
}));

// Mock React Query so we don't need React or a QueryClientProvider —
// we only care about the mutationFn contract. useMutation returns an object
// whose mutateAsync/mutate invoke the mutationFn directly.
vi.mock('@tanstack/react-query', () => ({
  useMutation: (opts: { mutationFn: (input: unknown) => Promise<unknown> }) => ({
    mutateAsync: opts.mutationFn,
    mutate: opts.mutationFn,
  }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

// After mocks are in place, import the hook module.
import { useCreateOperatorProspect } from '../use-prospects';

describe('useCreateOperatorProspect mutationFn contract', () => {
  beforeEach(() => {
    apiPostMock.mockClear();
  });

  it('sends action=create_operator_prospect with snake_case body', async () => {
    const mutation = useCreateOperatorProspect();
    await mutation.mutateAsync({
      email: 'hunter@test.com',
      fullName: 'Hunter Milborne',
      country: 'Canada',
      roleHint: 'RE developer',
      sourceVentureId: 'futurestate',
      track: 'investor_accredited',
      operatorNotes: 'long relationship',
      relationshipHistory: 'known several years',
      priorDeals: ['deal a', 'deal b'],
      aumEstimate: 250_000_000,
      checkSizeRange: '$100k–$1M',
      investorThesis: 'real estate + tokenization',
      socialProfiles: { linkedin: 'https://example.com/in/hunter' },
      priority: 'hot',
      archetype: 'investor',
      assignedPersonaId: 'quinn-uuid',
      assignedPersonaHandle: 'Quinn',
    });

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    const [path, body] = apiPostMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(path).toBe('/api/prospects');
    expect(body.action).toBe('create_operator_prospect');
    expect(body.email).toBe('hunter@test.com');
    expect(body.full_name).toBe('Hunter Milborne');
    expect(body.country).toBe('Canada');
    expect(body.role_hint).toBe('RE developer');
    expect(body.source_venture_id).toBe('futurestate');
    expect(body.track).toBe('investor_accredited');
    expect(body.operator_notes).toBe('long relationship');
    expect(body.relationship_history).toBe('known several years');
    expect(body.prior_deals).toEqual(['deal a', 'deal b']);
    expect(body.aum_estimate).toBe(250_000_000);
    expect(body.check_size_range).toBe('$100k–$1M');
    expect(body.investor_thesis).toBe('real estate + tokenization');
    expect(body.social_profiles).toEqual({ linkedin: 'https://example.com/in/hunter' });
    expect(body.priority).toBe('hot');
    expect(body.archetype).toBe('investor');
    expect(body.assigned_persona_id).toBe('quinn-uuid');
    expect(body.assigned_persona_handle).toBe('Quinn');
  });

  it('returns { profile, journey } passthrough', async () => {
    const mutation = useCreateOperatorProspect();
    const result = await mutation.mutateAsync({
      email: 'minimal@test.com',
      track: 'investor_accredited',
    });
    expect(result).toEqual({ profile: { id: 'p1' }, journey: { id: 'j1' } });
  });

  it('does not leak camelCase keys onto the wire', async () => {
    const mutation = useCreateOperatorProspect();
    await mutation.mutateAsync({
      email: 'minimal@test.com',
      track: 'investor_accredited',
    });
    const [, body] = apiPostMock.mock.calls[0] as [string, Record<string, unknown>];
    // camelCase keys must NOT leak through
    expect('fullName' in body).toBe(false);
    expect('roleHint' in body).toBe(false);
    expect('sourceVentureId' in body).toBe(false);
    expect('operatorNotes' in body).toBe(false);
    expect('relationshipHistory' in body).toBe(false);
    expect('priorDeals' in body).toBe(false);
    expect('aumEstimate' in body).toBe(false);
    expect('checkSizeRange' in body).toBe(false);
    expect('investorThesis' in body).toBe(false);
    expect('socialProfiles' in body).toBe(false);
    expect('assignedPersonaId' in body).toBe(false);
    expect('assignedPersonaHandle' in body).toBe(false);
  });
});
