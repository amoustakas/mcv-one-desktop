// src/lib/payments/index.ts
// Barrel export for the Smart Payment Router module.

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  ProcessorCapability,
  PaymentMethod,
  PaymentStatus,
  PaymentProcessor,
  PaymentRequest,
  PaymentResult,
  RefundResult,
  FeeEstimate,
  ProcessorHealth,
  RoutingRequest,
  RoutingDecision,
  RoutingFactors,
  SplitPaymentRequest,
  SplitPaymentResult,
  VenturePaymentConfig,
} from './types';

export {
  PaymentRequestSchema,
  SplitPaymentRequestSchema,
  VenturePaymentConfigSchema,
} from './types';

// ── Router ────────────────────────────────────────────────────────────────────
export { PaymentRouter, paymentRouter } from './router';

// ── Split Engine ──────────────────────────────────────────────────────────────
export { SplitPaymentEngine, splitPaymentEngine, calculatePlatformFee } from './split-engine';

// ── Processors ────────────────────────────────────────────────────────────────
export { stripeProcessor } from './processors/stripe';
export { creditsProcessor } from './processors/credits';
export { solanaProcessor } from './processors/solana';
