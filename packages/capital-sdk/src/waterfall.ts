// @mcv/capital-sdk/waterfall — pure cap-table math (no I/O).
//
// Computes pre/post-money ownership, dilution, and SAFE conversion.

import type { Round, Commitment } from './types';

export interface WaterfallEntry {
  contactId: string;
  amountUsd: number;
  sharesAllocated: number | null;
  ownershipPctPostRound: number; // 0-100
  pricePerShare: number | null;
}

export interface RoundWaterfall {
  roundId: string;
  totalCommittedUsd: number;
  totalFundedUsd: number;
  preMoneyValuation: number | null;
  postMoneyValuation: number | null;
  pricePerShare: number | null;
  newSharesIssued: number;
  founderDilutionPct: number; // 0-100
  entries: WaterfallEntry[];
}

/**
 * Compute the priced-equity waterfall for a round + its commitments.
 * Only commitments with status in (signed, pending_wire, funded, token_pending, token_distributed) count.
 *
 * For SAFE/convertible rounds, ownership is undefined until conversion at the next priced round.
 * This function returns a forward-looking estimate using the round's cap if present.
 */
export function computeWaterfall(round: Round, commitments: Commitment[]): RoundWaterfall {
  const SETTLED_STATUSES = new Set([
    'signed', 'pending_wire', 'funded', 'token_pending', 'token_distributed',
  ]);

  const settled = commitments.filter((c) => SETTLED_STATUSES.has(c.status));
  const totalCommittedUsd = settled.reduce((sum, c) => sum + c.amountUsd, 0);
  const totalFundedUsd = settled
    .filter((c) => c.status === 'funded' || c.status === 'token_distributed')
    .reduce((sum, c) => sum + c.amountUsd, 0);

  const isPriced = round.roundType === 'priced_equity';
  const preMoney = round.preMoneyValuation;
  const pricePerShare = round.pricePerShare;
  const postMoney = preMoney !== null ? preMoney + totalCommittedUsd : null;

  let newSharesIssued = 0;
  let founderDilutionPct = 0;

  if (isPriced && pricePerShare !== null && pricePerShare > 0) {
    newSharesIssued = totalCommittedUsd / pricePerShare;
  }
  if (isPriced && postMoney !== null && postMoney > 0) {
    founderDilutionPct = (totalCommittedUsd / postMoney) * 100;
  }

  const entries: WaterfallEntry[] = settled.map((c) => {
    const shares = isPriced && pricePerShare !== null && pricePerShare > 0
      ? c.amountUsd / pricePerShare
      : null;
    const ownership = postMoney !== null && postMoney > 0
      ? (c.amountUsd / postMoney) * 100
      : 0;
    return {
      contactId: c.contactId,
      amountUsd: c.amountUsd,
      sharesAllocated: shares,
      ownershipPctPostRound: ownership,
      pricePerShare,
    };
  });

  return {
    roundId: round.id,
    totalCommittedUsd,
    totalFundedUsd,
    preMoneyValuation: preMoney,
    postMoneyValuation: postMoney,
    pricePerShare,
    newSharesIssued,
    founderDilutionPct,
    entries,
  };
}

/**
 * SAFE conversion estimator. Given a SAFE commitment + a future priced round,
 * returns the shares the SAFE holder will receive at conversion.
 *
 * Conversion price = min(SAFE_cap_price, priced_round_price * (1 - SAFE_discount))
 */
export function estimateSafeConversion(
  safeCommitment: Commitment,
  safeRound: Round,
  futurePricedRoundPricePerShare: number,
): { conversionPrice: number; sharesAtConversion: number } {
  const discount = safeRound.discountRate ?? 0;
  const cap = safeRound.valuationCap;

  const discountedPrice = futurePricedRoundPricePerShare * (1 - discount / 100);
  const capPrice = cap !== null && cap > 0 ? cap / 1_000_000 : Infinity; // simplified — assumes 1M FDS
  const conversionPrice = Math.min(discountedPrice, capPrice);

  const sharesAtConversion = conversionPrice > 0
    ? safeCommitment.amountUsd / conversionPrice
    : 0;

  return { conversionPrice, sharesAtConversion };
}

/**
 * Compute round progress as a 0-100 percentage of target.
 */
export function roundProgressPct(round: Round): number {
  if (round.targetRaise <= 0) return 0;
  return Math.min(100, (round.totalCommitted / round.targetRaise) * 100);
}

/**
 * Days until funding deadline (negative if past).
 */
export function daysUntilDeadline(round: Round): number | null {
  if (!round.fundingDeadline) return null;
  const ms = new Date(round.fundingDeadline).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
