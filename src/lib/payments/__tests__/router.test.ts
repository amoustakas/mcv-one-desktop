// src/lib/payments/__tests__/router.test.ts
//
// Vitest tests for PaymentRouter

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentRouter } from '../router';
import type {
  PaymentProcessor,
  PaymentRequest,
  RoutingRequest,
  FeeEstimate,
  PaymentResult,
  ProcessorHealth,
  RefundResult,
  PaymentStatus,
} from '../types';

// ── HELPERS ──────────────────────────────────────────────────────────────────

function makeFee(total: number, fixed = 0, pct = 0, currency = 'USD'): FeeEstimate {
  return { fixedFee: fixed, percentageFee: pct, totalFee: total, currency };
}

function makeProcessor(overrides: Partial<PaymentProcessor> & { id: string }): PaymentProcessor {
  return {
    id:                   overrides.id,
    name:                 overrides.name ?? overrides.id,
    capabilities:         overrides.capabilities         ?? ['one_time'],
    supportedCurrencies:  overrides.supportedCurrencies  ?? ['USD'],
    supportedCountries:   overrides.supportedCountries   ?? ['US', '*'],
    supportedMethods:     overrides.supportedMethods     ?? ['card'],
    createPayment:        overrides.createPayment        ?? vi.fn(),
    refundPayment:        overrides.refundPayment        ?? vi.fn(),
    getStatus:            overrides.getStatus            ?? vi.fn(),
    estimateFee:          overrides.estimateFee          ?? vi.fn(),
    getHealth:            overrides.getHealth            ?? vi.fn(),
  };
}

function baseRoutingReq(overrides: Partial<RoutingRequest> = {}): RoutingRequest {
  return {
    amount:          100,
    currency:        'USD',
    customerCountry: 'US',
    paymentMethod:   null,
    urgency:         'standard',
    ventureId:       'mcv',
    customerId:      'cust_001',
    isRecurring:     false,
    ...overrides,
  };
}

function basePaymentReq(overrides: Partial<PaymentRequest> = {}): PaymentRequest {
  return {
    amount:          100,
    currency:        'USD',
    method:          null,
    customerId:      'cust_001',
    customerCountry: 'US',
    ventureId:       'mcv',
    description:     'Test payment',
    metadata:        {},
    ...overrides,
  };
}

// ── TESTS ─────────────────────────────────────────────────────────────────────

describe('PaymentRouter', () => {
  // ── Test 1: routes to cheapest processor ─────────────────────────────────

  describe('routes to cheapest processor', () => {
    it('picks platform_credits (zero fee) over Stripe (2.9% + $0.30) for a $100 USD payment', async () => {
      const router = new PaymentRouter();

      // Stripe charges 2.9% + $0.30 on $100 → $3.20
      // Credits charge $0.00
      // So credits should score highest on the cost factor and win overall.

      const decision = await router.route(baseRoutingReq());

      expect(decision.primaryRail).toBe('platform_credits');
      expect(decision.estimatedFee.totalFee).toBe(0);
    });

    it('savings vs default equals stripe card fee minus chosen fee', async () => {
      const router = new PaymentRouter();
      const decision = await router.route(baseRoutingReq({ amount: 100 }));

      // Stripe card fee for $100: 100 * 0.029 + 0.30 = 3.20
      const expectedStripeFee = 100 * 0.029 + 0.30;
      expect(decision.savingsVsDefault).toBeCloseTo(expectedStripeFee - decision.estimatedFee.totalFee, 5);
    });
  });

  // ── Test 2: falls back when primary fails ─────────────────────────────────

  describe('falls back when primary fails', () => {
    it('uses the next eligible rail when the primary processor throws', async () => {
      const router = new PaymentRouter();

      // Override credits processor to throw
      const creditsProcessor = router.getProcessor('platform_credits')!;
      vi.spyOn(creditsProcessor, 'createPayment').mockRejectedValueOnce(
        new Error('Insufficient credits'),
      );

      // Override stripe to succeed
      const stripeProcessor = router.getProcessor('stripe')!;
      const mockStripeResult: PaymentResult = {
        success:            true,
        paymentId:          'pay_fallback_001',
        processorId:        'stripe',
        processorPaymentId: 'pi_fallback',
        status:             'succeeded',
        amount:             100,
        currency:           'USD',
        fee:                makeFee(3.20, 0.30, 0.029),
      };
      vi.spyOn(stripeProcessor, 'createPayment').mockResolvedValueOnce(mockStripeResult);

      const { result, decision } = await router.processPayment(basePaymentReq());

      expect(result.success).toBe(true);
      expect(result.processorId).toBe('stripe');
      // The decision still reports the originally routed primary (credits)
      expect(decision.primaryRail).toBe('platform_credits');
    });

    it('returns failure when all rails fail', async () => {
      const router = new PaymentRouter();

      // Make every processor fail
      for (const p of router.getProcessors()) {
        vi.spyOn(p, 'createPayment').mockRejectedValue(new Error('all down'));
      }

      const { result } = await router.processPayment(basePaymentReq());

      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
    });
  });

  // ── Test 3: filters by supported currency ────────────────────────────────

  describe('filters by supported currency', () => {
    it('routes USDC payment exclusively to Solana (Stripe does not support USDC)', async () => {
      const router = new PaymentRouter();

      const decision = await router.route(
        baseRoutingReq({ currency: 'USDC', paymentMethod: 'usdc' }),
      );

      expect(decision.primaryRail).toBe('solana');
      // Stripe and credits must not appear in any rail
      expect(decision.fallbackRails).not.toContain('stripe');
      expect(decision.fallbackRails).not.toContain('platform_credits');
    });

    it('throws when no processor supports the requested currency', async () => {
      const router = new PaymentRouter();

      await expect(
        router.route(baseRoutingReq({ currency: 'XYZ_FAKE', paymentMethod: null })),
      ).rejects.toThrow(/No eligible processor/);
    });
  });

  // ── Test 4: respects venture preferred rail ───────────────────────────────

  describe('respects venture preferred rail', () => {
    it('scores Stripe higher when preferredRail is stripe, even though credits is cheaper', async () => {
      const router = new PaymentRouter();

      const decision = await router.route(
        baseRoutingReq({ amount: 100 }),
        {
          ventureId:           'futurestate',
          enabledProcessors:   ['stripe', 'platform_credits', 'solana'],
          preferredRail:       'stripe',
          platformFee:         { type: 'percentage', value: 0 },
          autoPayoutSchedule:  'weekly',
          autoPayoutMinimum:   100,
          cryptoEnabled:       false,
          creditSystemEnabled: true,
          invoicingEnabled:    true,
        },
      );

      // preference_score for stripe = 1.0 vs 0.5 for others
      // That 0.5-point boost on a 0.15 weight = +0.075 to stripe's score
      // which should be enough to push Stripe ahead of credits
      expect(decision.primaryRail).toBe('stripe');
    });
  });

  // ── Test 5: calculates savings vs default ────────────────────────────────

  describe('calculates savings vs default', () => {
    it('reports zero savings when Stripe card is already the cheapest', async () => {
      // Build a router with only Stripe registered
      const router = new PaymentRouter();

      // Remove credits and solana so Stripe is forced
      // We do this by routing a non-USD currency that only Stripe handles
      // Actually credits support USD too, so we isolate with a custom processor list.
      // Use ventureConfig.enabledProcessors to force Stripe only.
      const decision = await router.route(
        baseRoutingReq({ amount: 50 }),
        {
          ventureId:           'edgeiq',
          enabledProcessors:   ['stripe'],
          preferredRail:       null,
          platformFee:         { type: 'flat', value: 0 },
          autoPayoutSchedule:  'weekly',
          autoPayoutMinimum:   100,
          cryptoEnabled:       false,
          creditSystemEnabled: false,
          invoicingEnabled:    true,
        },
      );

      expect(decision.primaryRail).toBe('stripe');
      // Stripe IS the default, so savings vs default should be 0
      expect(decision.savingsVsDefault).toBe(0);
    });

    it('reports correct savings when credits replaces Stripe for $200', async () => {
      const router = new PaymentRouter();
      const amount = 200;
      const decision = await router.route(baseRoutingReq({ amount }));

      const stripeCardFee = amount * 0.029 + 0.30; // $6.10
      // credits fee is $0
      expect(decision.primaryRail).toBe('platform_credits');
      expect(decision.savingsVsDefault).toBeCloseTo(stripeCardFee, 5);
    });
  });

  // ── Test 6: getProcessors / getProcessor ─────────────────────────────────

  describe('processor registry', () => {
    it('returns all three built-in processors', () => {
      const router = new PaymentRouter();
      const ids = router.getProcessors().map(p => p.id);
      expect(ids).toContain('stripe');
      expect(ids).toContain('platform_credits');
      expect(ids).toContain('solana');
    });

    it('getProcessor returns undefined for unknown id', () => {
      const router = new PaymentRouter();
      expect(router.getProcessor('nonexistent')).toBeUndefined();
    });

    it('allows registering a custom processor', () => {
      const router = new PaymentRouter();
      const custom = makeProcessor({ id: 'custom_rail' });
      router.register(custom);
      expect(router.getProcessor('custom_rail')).toBe(custom);
    });
  });

  // ── Test 7: estimateRoute delegates to route ──────────────────────────────

  describe('estimateRoute', () => {
    it('returns a RoutingDecision without executing any payment', async () => {
      const router = new PaymentRouter();

      // Spy on createPayment for all processors — none should be called
      const spies = router.getProcessors().map(p =>
        vi.spyOn(p, 'createPayment'),
      );

      const decision = await router.estimateRoute(baseRoutingReq());

      expect(decision.primaryRail).toBeDefined();
      for (const spy of spies) {
        expect(spy).not.toHaveBeenCalled();
      }
    });
  });
});
