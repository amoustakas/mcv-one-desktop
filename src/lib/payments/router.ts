// Shim over @mcv/payments-sdk with MCV Desktop's credits processor wired in.
//
// The SDK ships three rails (stripe / plaid / solana). MCV Desktop has a
// fourth — platform credits backed by the local Supabase ledger. The rest
// of the root app uses `paymentRouter` as a pre-configured singleton, so
// this shim re-exports PaymentRouter from the SDK and builds a Desktop
// singleton with credits registered.

export {
  PaymentRouter,
  type RoutingRequest,
  type RoutingDecision,
  type RoutingFactors,
  type PaymentProcessor,
  type PaymentRequest,
  type PaymentResult,
  type RefundResult,
  type FeeEstimate,
  type ProcessorHealth,
  type PaymentStatus,
  type PaymentMethod,
  type VenturePaymentConfig,
} from '@mcv/payments-sdk';

import { PaymentRouter } from '@mcv/payments-sdk';
import { setSharedPaymentRouter } from '@mcv/payments-sdk/shared-router';
import { creditsProcessor } from './processors/credits';

/**
 * MCV Desktop payment router singleton — SDK base + credits processor.
 * Root-app consumers continue to `import { paymentRouter } from '@/lib/payments/router'`.
 * Registered with the SDK's shared-router so kits and other cross-cutting
 * code can reach this instance without dynamic imports.
 */
export const paymentRouter = new PaymentRouter();
paymentRouter.register(creditsProcessor);
setSharedPaymentRouter(paymentRouter);
