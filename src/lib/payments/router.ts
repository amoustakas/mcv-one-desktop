// src/lib/payments/router.ts
//
// PaymentRouter — decision engine for the Smart Payment Router.
// Scores all eligible processors using a weighted multi-factor model and
// selects the optimal rail for each payment request.

import type {
  PaymentProcessor,
  RoutingRequest,
  RoutingDecision,
  FeeEstimate,
  PaymentRequest,
  PaymentResult,
  VenturePaymentConfig,
} from './types';
import { stripeProcessor } from './processors/stripe';
import { creditsProcessor } from './processors/credits';
import { solanaProcessor } from './processors/solana';
import { plaidProcessor } from './processors/plaid';

// ── ROUTING WEIGHTS ──────────────────────────────────────────────────────────
// Must sum to 1.0

const WEIGHTS = {
  cost:        0.35,
  speed:       0.20,
  reliability: 0.20,
  compliance:  0.10,
  preference:  0.15,
};

// ── SPEED SCORES (0–1, higher = faster settlement) ──────────────────────────

const SPEED_SCORES: Record<string, number> = {
  platform_credits: 1.00,  // instant in-app ledger debit
  solana:           0.95,  // ~400 ms on-chain confirmation
  stripe:           0.50,  // 2–3 business day bank settlement
  plaid:            0.40,  // 3–5 business day standard ACH (next-day with same-day ACH)
};

// ── RELIABILITY SCORES (0–1) ─────────────────────────────────────────────────

const RELIABILITY_SCORES: Record<string, number> = {
  platform_credits: 1.00,
  stripe:           0.95,
  plaid:            0.92,  // mature ACH rails, some return risk
  solana:           0.70,  // stub — real value from health metrics in future
};

// ── COMPLIANCE SCORES (0–1) ──────────────────────────────────────────────────
// Higher = better regulatory standing / KYC/AML coverage

const COMPLIANCE_SCORES: Record<string, number> = {
  stripe:           1.00,  // full KYC/AML, PCI-DSS Level 1
  plaid:            0.98,  // full KYC via Plaid Identity, NACHA-compliant
  platform_credits: 0.90,  // internal — inherits platform compliance
  solana:           0.60,  // permissionless chain, minimal built-in compliance
};

// ── STRIPE CARD FEE CONSTANTS (for savings calculation) ─────────────────────

const STRIPE_CARD_PERCENT = 0.029;
const STRIPE_CARD_FIXED   = 0.30;

// ── SCORED CANDIDATE ─────────────────────────────────────────────────────────

interface ScoredCandidate {
  processor: PaymentProcessor;
  fee: FeeEstimate;
  score: number;
}

// ── PAYMENT ROUTER ───────────────────────────────────────────────────────────

export class PaymentRouter {
  private readonly processors: Map<string, PaymentProcessor> = new Map();

  constructor() {
    this.register(stripeProcessor);
    this.register(creditsProcessor);
    this.register(solanaProcessor);
    this.register(plaidProcessor);
  }

  /** Register a processor. Later registrations with the same ID overwrite. */
  register(processor: PaymentProcessor): void {
    this.processors.set(processor.id, processor);
  }

  /** Return all registered processors. */
  getProcessors(): PaymentProcessor[] {
    return Array.from(this.processors.values());
  }

  /** Get a single processor by ID, or undefined if not found. */
  getProcessor(id: string): PaymentProcessor | undefined {
    return this.processors.get(id);
  }

  // ── CORE ROUTING ────────────────────────────────────────────────────────────

  /**
   * Score every eligible processor and return a RoutingDecision.
   *
   * Eligibility rules:
   *   1. Supports the requested currency (or has wildcard '*').
   *   2. Supports the customer's country (or has wildcard '*').
   *   3. If a specific payment method was requested, the processor must
   *      include that method in its `supportedMethods` list.
   *
   * Scoring (0–1 per factor):
   *   cost_score        = 1 - (totalFee / amount)       [lower fee → higher score]
   *   speed_score       = SPEED_SCORES[id] ?? 0.5
   *   reliability_score = RELIABILITY_SCORES[id] ?? 0.5
   *   compliance_score  = COMPLIANCE_SCORES[id] ?? 0.5
   *   preference_score  = 1.0 if processor matches ventureConfig.preferredRail, else 0.5
   *
   * Weighted total = Σ(factor_score × weight)
   */
  async route(
    request: RoutingRequest,
    ventureConfig?: VenturePaymentConfig,
  ): Promise<RoutingDecision> {
    const candidates = await this._scoreCandidates(request, ventureConfig);

    if (candidates.length === 0) {
      throw new Error(
        `No eligible processor found for ${request.currency} in ${request.customerCountry}` +
        (request.paymentMethod ? ` with method ${request.paymentMethod}` : ''),
      );
    }

    // Sort descending by score
    candidates.sort((a, b) => b.score - a.score);

    const primary = candidates[0];
    const fallbacks = candidates.slice(1);

    // Calculate savings vs the Stripe card default
    const stripeCardFee = request.amount * STRIPE_CARD_PERCENT + STRIPE_CARD_FIXED;
    const savingsVsDefault = Math.max(0, stripeCardFee - primary.fee.totalFee);

    // Estimated settlement description
    const settlementLabel = this._settlementLabel(primary.processor.id, request.urgency);

    return {
      primaryRail:           primary.processor.id,
      fallbackRails:         fallbacks.map(c => c.processor.id),
      estimatedFee:          primary.fee,
      estimatedSettlement:   settlementLabel,
      reasoning:             this._buildReasoning(primary, candidates),
      savingsVsDefault,
    };
  }

  // ── PROCESS PAYMENT ─────────────────────────────────────────────────────────

  /**
   * Route and then execute the payment.
   * Attempts the primary rail; on failure walks the fallback list in order.
   * Returns the PaymentResult plus the RoutingDecision that was used.
   */
  async processPayment(
    request: PaymentRequest,
    ventureConfig?: VenturePaymentConfig,
  ): Promise<{ result: PaymentResult; decision: RoutingDecision }> {
    const routingReq: RoutingRequest = {
      amount:          request.amount,
      currency:        request.currency,
      customerCountry: request.customerCountry,
      paymentMethod:   request.method,
      urgency:         'standard',
      ventureId:       request.ventureId,
      customerId:      request.customerId,
      isRecurring:     false,
    };

    const decision = await this.route(routingReq, ventureConfig);

    const railIds = [decision.primaryRail, ...decision.fallbackRails];

    let lastResult: PaymentResult | undefined;

    for (const railId of railIds) {
      const processor = this.getProcessor(railId);
      if (!processor) continue;

      try {
        const result = await processor.createPayment(request);
        if (result.success) {
          return { result, decision };
        }
        lastResult = result;
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        lastResult = {
          success:            false,
          paymentId:          '',
          processorId:        railId,
          processorPaymentId: null,
          status:             'failed',
          amount:             request.amount,
          currency:           request.currency,
          fee:                { fixedFee: 0, percentageFee: 0, totalFee: 0, currency: request.currency },
          error,
        };
      }
    }

    // All rails failed — return the last failure
    return {
      result: lastResult ?? {
        success:            false,
        paymentId:          '',
        processorId:        decision.primaryRail,
        processorPaymentId: null,
        status:             'failed',
        amount:             request.amount,
        currency:           request.currency,
        fee:                decision.estimatedFee,
        error:              'All payment rails failed',
      },
      decision,
    };
  }

  // ── ESTIMATE ROUTE ──────────────────────────────────────────────────────────

  /**
   * Return a RoutingDecision without executing any payment.
   * Used by UI to preview cost / rail before the user confirms.
   */
  async estimateRoute(
    request: RoutingRequest,
    ventureConfig?: VenturePaymentConfig,
  ): Promise<RoutingDecision> {
    return this.route(request, ventureConfig);
  }

  // ── INTERNAL HELPERS ────────────────────────────────────────────────────────

  private async _scoreCandidates(
    request: RoutingRequest,
    ventureConfig?: VenturePaymentConfig,
  ): Promise<ScoredCandidate[]> {
    const currencyUpper = request.currency.toUpperCase();

    const eligible = this.getProcessors().filter(p => {
      // Currency check (wildcard '*' means all)
      const supportsCurrency =
        p.supportedCurrencies.includes('*') ||
        p.supportedCurrencies.map(c => c.toUpperCase()).includes(currencyUpper);

      if (!supportsCurrency) return false;

      // Country check (wildcard '*' means all)
      const supportsCountry =
        p.supportedCountries.includes('*') ||
        p.supportedCountries.includes(request.customerCountry);

      if (!supportsCountry) return false;

      // Method check (only applied when a specific method was requested)
      if (request.paymentMethod !== null) {
        const supportsMethod = p.supportedMethods.includes(request.paymentMethod);
        if (!supportsMethod) return false;
      }

      // If ventureConfig restricts to specific processors, filter accordingly
      if (ventureConfig?.enabledProcessors && ventureConfig.enabledProcessors.length > 0) {
        if (!ventureConfig.enabledProcessors.includes(p.id)) return false;
      }

      return true;
    });

    if (eligible.length === 0) return [];

    // Estimate fees in parallel
    const feeReq: PaymentRequest = {
      amount:          request.amount,
      currency:        request.currency,
      method:          request.paymentMethod,
      customerId:      request.customerId,
      customerCountry: request.customerCountry,
      ventureId:       request.ventureId,
      description:     '',
      metadata:        {},
    };

    const feeResults = await Promise.allSettled(
      eligible.map(p => p.estimateFee(feeReq).then(fee => ({ processorId: p.id, fee }))),
    );

    const scored: ScoredCandidate[] = [];

    for (let i = 0; i < eligible.length; i++) {
      const processor = eligible[i];
      const settled = feeResults[i];

      let fee: FeeEstimate;
      if (settled.status === 'fulfilled') {
        fee = settled.value.fee;
      } else {
        // If fee estimate failed, assign a high fee to demote this processor
        fee = {
          fixedFee:      request.amount * 0.05,
          percentageFee: 0.05,
          totalFee:      request.amount * 0.05,
          currency:      request.currency,
        };
      }

      const score = this._computeScore(processor, fee, request, ventureConfig);
      scored.push({ processor, fee, score });
    }

    return scored;
  }

  private _computeScore(
    processor: PaymentProcessor,
    fee: FeeEstimate,
    request: RoutingRequest,
    ventureConfig?: VenturePaymentConfig,
  ): number {
    // Cost score: lower fee ratio → higher score
    // Guard against divide-by-zero for zero-amount requests
    const feeRatio = request.amount > 0 ? fee.totalFee / request.amount : 0;
    const costScore = Math.max(0, Math.min(1, 1 - feeRatio));

    const speedScore       = SPEED_SCORES[processor.id]       ?? 0.5;
    const reliabilityScore = RELIABILITY_SCORES[processor.id] ?? 0.5;
    const complianceScore  = COMPLIANCE_SCORES[processor.id]  ?? 0.5;

    const preferenceScore =
      ventureConfig?.preferredRail === processor.id ? 1.0 : 0.5;

    return (
      costScore        * WEIGHTS.cost        +
      speedScore       * WEIGHTS.speed       +
      reliabilityScore * WEIGHTS.reliability +
      complianceScore  * WEIGHTS.compliance  +
      preferenceScore  * WEIGHTS.preference
    );
  }

  private _settlementLabel(processorId: string, urgency: RoutingRequest['urgency']): string {
    if (processorId === 'platform_credits') return 'Instant';
    if (processorId === 'solana')           return '~400ms (on-chain)';
    if (processorId === 'stripe') {
      if (urgency === 'instant')   return 'Instant Payout (additional fee may apply)';
      if (urgency === 'same_day')  return 'Same-day ACH';
      return '2–3 business days';
    }
    return 'Unknown';
  }

  private _buildReasoning(primary: ScoredCandidate, all: ScoredCandidate[]): string {
    const competitors = all
      .slice(1)
      .map(c => `${c.processor.name} (score ${c.score.toFixed(3)})`)
      .join(', ');

    return (
      `Selected ${primary.processor.name} with score ${primary.score.toFixed(3)}` +
      (competitors ? `; alternatives: ${competitors}` : '') +
      `. Estimated fee: $${primary.fee.totalFee.toFixed(4)} (fixed $${primary.fee.fixedFee}, ${(primary.fee.percentageFee * 100).toFixed(2)}%).`
    );
  }
}

// ── SINGLETON ────────────────────────────────────────────────────────────────

export const paymentRouter = new PaymentRouter();
