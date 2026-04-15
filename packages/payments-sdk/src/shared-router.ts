// @mcv/payments-sdk/shared-router — module-level handle for a pre-wired
// PaymentRouter singleton.
//
// Rationale: kit handlers and other cross-cutting code often want access
// to the app's configured PaymentRouter (with credits processor et al
// registered) without dynamically importing app modules. Apps call
// `setSharedPaymentRouter(routerInstance)` once at module load; consumers
// call `getSharedPaymentRouter()` to retrieve it.
//
// Returns `null` until set — callers should handle the unconfigured case
// gracefully (typically by returning a "no data" response).

import type { PaymentRouter } from './router';

let sharedRouter: PaymentRouter | null = null;

/** Register the app's configured PaymentRouter so kit handlers and other
 *  code can reach it without dynamic imports. Call once at app startup. */
export function setSharedPaymentRouter(router: PaymentRouter): void {
  sharedRouter = router;
}

/** Retrieve the shared PaymentRouter set via `setSharedPaymentRouter`.
 *  Returns null if no app has wired one yet. */
export function getSharedPaymentRouter(): PaymentRouter | null {
  return sharedRouter;
}
