// @ts-nocheck
// src/views/Checkout.tsx
// Full-page checkout view — wraps CheckoutFlow, handles cart fetch

import { useEffect } from 'react';
import { useCommerceSurfaceStore } from '../stores/commerce-surface';
import { PageShell, PageHeader } from '../components/ui';
import { CheckoutFlow } from '../components/commerce/checkout';
import type { OrderConfirmation } from '../lib/commerce/checkout-service';

// TODO: wire up real venture context + customer auth when available
const DEFAULT_VENTURE = 'mcv';

export default function Checkout() {
  const { cart, cartLoading, createCart } = useCommerceSurfaceStore();

  // Ensure cart exists on mount
  useEffect(() => {
    if (!cart && !cartLoading) {
      createCart(DEFAULT_VENTURE).catch(() => null);
    }
  }, [cart, cartLoading, createCart]);

  function handleComplete(confirmation: OrderConfirmation) {
    // Confirmation UI is handled inside CheckoutFlow/CheckoutConfirmation
    console.info('[Checkout] Order confirmed:', confirmation.orderNumber);
  }

  return (
    <PageShell scroll>
      <PageHeader
        title="Checkout"
        subtitle="Complete your order"
        loading={cartLoading}
      />
      <CheckoutFlow
        ventureId={DEFAULT_VENTURE}
        onComplete={handleComplete}
      />
    </PageShell>
  );
}
