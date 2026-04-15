// Pure-logic tests for status machines + waterfall.
// These run WITHOUT Supabase — they exercise the domain rules directly.
//
// Integration tests against a real DB live separately (scripts/capital-integration.test.ts)
// since they require env setup and destructive state.

import { describe, it, expect } from 'vitest';
import {
  canTransitionRound,
  canTransitionCommitment,
  ROUND_STATUS_TRANSITIONS,
  COMMITMENT_STATUS_TRANSITIONS,
  type RoundStatus,
  type CommitmentStatus,
} from '../types';
import {
  computeWaterfall,
  roundProgressPct,
  daysUntilDeadline,
} from '../waterfall';

describe('round status machine', () => {
  it('allows draft → preview → open → closing → closed → funded', () => {
    expect(canTransitionRound('draft', 'preview')).toBe(true);
    expect(canTransitionRound('preview', 'open')).toBe(true);
    expect(canTransitionRound('open', 'closing')).toBe(true);
    expect(canTransitionRound('closing', 'closed')).toBe(true);
    expect(canTransitionRound('closed', 'funded')).toBe(true);
  });

  it('allows cancellation from pre-funded states', () => {
    const cancellable: RoundStatus[] = ['draft', 'preview', 'open', 'closing'];
    for (const s of cancellable) expect(canTransitionRound(s, 'cancelled')).toBe(true);
  });

  it('forbids backwards transitions except open/draft recoveries', () => {
    expect(canTransitionRound('funded', 'open')).toBe(false);
    expect(canTransitionRound('closed', 'open')).toBe(false);
    expect(canTransitionRound('closing', 'open')).toBe(true); // open can resurface
    expect(canTransitionRound('open', 'draft')).toBe(false);
  });

  it('funded + cancelled are terminal', () => {
    expect(ROUND_STATUS_TRANSITIONS.funded).toHaveLength(0);
    expect(ROUND_STATUS_TRANSITIONS.cancelled).toHaveLength(0);
  });
});

describe('commitment status machine', () => {
  it('allows the happy path: interest → soft_commit → reserved → pending_docs → signed → funded → token_distributed', () => {
    expect(canTransitionCommitment('interest', 'soft_commit')).toBe(true);
    expect(canTransitionCommitment('soft_commit', 'reserved')).toBe(true);
    expect(canTransitionCommitment('reserved', 'pending_docs')).toBe(true);
    expect(canTransitionCommitment('pending_docs', 'signed')).toBe(true);
    expect(canTransitionCommitment('signed', 'funded')).toBe(true);
    expect(canTransitionCommitment('funded', 'token_distributed')).toBe(true);
  });

  it('allows wire → funded path', () => {
    expect(canTransitionCommitment('signed', 'pending_wire')).toBe(true);
    expect(canTransitionCommitment('pending_wire', 'funded')).toBe(true);
  });

  it('forbids skipping signature', () => {
    expect(canTransitionCommitment('soft_commit', 'funded')).toBe(false);
    expect(canTransitionCommitment('reserved', 'funded')).toBe(false);
  });

  it('allows withdrawal from pre-signed states', () => {
    const withdrawable: CommitmentStatus[] = ['interest', 'soft_commit', 'reserved', 'pending_docs'];
    for (const s of withdrawable) expect(canTransitionCommitment(s, 'withdrawn')).toBe(true);
    // Not allowed once signed
    expect(canTransitionCommitment('signed', 'withdrawn')).toBe(false);
    expect(canTransitionCommitment('funded', 'withdrawn')).toBe(false);
  });

  it('allows refund from signed+ states', () => {
    expect(canTransitionCommitment('signed', 'refunded')).toBe(true);
    expect(canTransitionCommitment('funded', 'refunded')).toBe(true);
    expect(canTransitionCommitment('token_distributed', 'refunded')).toBe(true);
  });

  it('refunded + withdrawn are terminal', () => {
    expect(COMMITMENT_STATUS_TRANSITIONS.refunded).toHaveLength(0);
    expect(COMMITMENT_STATUS_TRANSITIONS.withdrawn).toHaveLength(0);
  });
});

describe('waterfall', () => {
  const baseRound = {
    id: 'round-1',
    ventureId: 'venture-1',
    name: 'Test', slug: 'test', description: null,
    roundType: 'priced_equity' as const,
    raiseLane: 'equity' as const,
    status: 'open' as const,
    targetRaise: 1_000_000,
    hardCap: null, softCap: null, minimumCheck: 10_000, maximumCheck: null, currency: 'USD',
    preMoneyValuation: 9_000_000,
    postMoneyValuation: null,
    pricePerShare: 1.0,
    pricePerToken: null,
    sharesAvailable: null, tokensAvailable: null,
    valuationCap: null, discountRate: null, interestRate: null,
    vestingSchedule: null, tokenWarrantRatio: null,
    totalCommitted: 0, totalFunded: 0, totalInvestors: 0, allocationRemaining: null,
    openDate: null, closeDate: null, fundingDeadline: null,
    regulatoryFramework: null, accreditedOnly: false,
    jurisdictionRestrictions: [], maxInvestors: null,
    termSheetUrl: null, safeTemplateUrl: null, subscriptionAgreementUrl: null,
    pitchDeckUrl: null, dataRoomUrl: null,
    isPublic: false, publicPageSlug: null, featuredOrder: null,
    tokenMintAddress: null, tokenSymbol: null, tokenDecimals: null,
    vestingContractAddress: null, escrowType: null, escrowAccountId: null,
    tags: [], metadata: {},
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', deletedAt: null,
  };

  const mkCommit = (contactId: string, amountUsd: number, status: CommitmentStatus) => ({
    id: `commit-${contactId}`,
    ventureId: 'venture-1',
    contactId,
    roundId: 'round-1',
    organizationId: null,
    status, amount: amountUsd, currency: 'USD', amountUsd,
    sharesAllocated: null, ownershipPct: null, tokensAllocated: null,
    tokenPriceAtCommit: null, walletAddress: null,
    equityComponent: null, tokenWarrantComponent: null,
    paymentMethod: null, paymentReference: null, paymentReceivedAt: null,
    docusignEnvelopeId: null, docusignStatus: null, signedAt: null,
    documentUrls: [],
    interestExpressedAt: null, softCommittedAt: null, reservedAt: null,
    fundedAt: null, distributedAt: null,
    notes: null, internalNotes: null, source: null, referralContactId: null,
    metadata: {},
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', deletedAt: null,
  });

  it('includes only settled commitments (signed+) in the waterfall', () => {
    const commits = [
      mkCommit('A', 100_000, 'signed'),
      mkCommit('B', 200_000, 'funded'),
      mkCommit('C', 50_000, 'soft_commit'),   // excluded
      mkCommit('D', 30_000, 'interest'),       // excluded
      mkCommit('E', 70_000, 'withdrawn'),      // excluded
    ];
    const wf = computeWaterfall(baseRound, commits);
    expect(wf.totalCommittedUsd).toBe(300_000);
    expect(wf.totalFundedUsd).toBe(200_000);
    expect(wf.entries).toHaveLength(2);
  });

  it('computes post-money + dilution correctly for priced round', () => {
    const commits = [
      mkCommit('A', 500_000, 'signed'),
      mkCommit('B', 500_000, 'funded'),
    ];
    const wf = computeWaterfall(baseRound, commits);
    expect(wf.postMoneyValuation).toBe(10_000_000);
    expect(wf.founderDilutionPct).toBeCloseTo(10); // 1M raised on 10M post = 10%
    expect(wf.newSharesIssued).toBe(1_000_000); // 1M USD / $1/share
  });

  it('computes ownership per entry', () => {
    const commits = [mkCommit('A', 250_000, 'funded')];
    const wf = computeWaterfall(baseRound, commits);
    // 250K raised, post-money = 9M + 250K = 9.25M → ownership = 250K/9.25M ≈ 2.7%
    expect(wf.entries[0].ownershipPctPostRound).toBeCloseTo(2.7, 1);
  });

  it('returns zero founder dilution for SAFE (no preMoney)', () => {
    const safe = { ...baseRound, roundType: 'safe' as const, preMoneyValuation: null, pricePerShare: null };
    const commits = [mkCommit('A', 500_000, 'signed')];
    const wf = computeWaterfall(safe, commits);
    expect(wf.founderDilutionPct).toBe(0);
    expect(wf.newSharesIssued).toBe(0);
  });
});

describe('roundProgressPct', () => {
  const base = { targetRaise: 1_000_000, totalCommitted: 0 } as never;
  it('returns 0 on empty round', () => {
    expect(roundProgressPct({ ...base, totalCommitted: 0 })).toBe(0);
  });
  it('caps at 100%', () => {
    expect(roundProgressPct({ ...base, totalCommitted: 1_500_000 })).toBe(100);
  });
  it('computes percentage correctly', () => {
    expect(roundProgressPct({ ...base, totalCommitted: 250_000 })).toBe(25);
  });
  it('returns 0 when target is 0', () => {
    expect(roundProgressPct({ targetRaise: 0, totalCommitted: 1_000 } as never)).toBe(0);
  });
});

describe('daysUntilDeadline', () => {
  it('returns null when no deadline', () => {
    expect(daysUntilDeadline({ fundingDeadline: null } as never)).toBeNull();
  });
  it('returns positive for future deadline', () => {
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(daysUntilDeadline({ fundingDeadline: future } as never)).toBeGreaterThanOrEqual(9);
  });
  it('returns negative for past deadline', () => {
    const past = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(daysUntilDeadline({ fundingDeadline: past } as never)).toBeLessThan(0);
  });
});
