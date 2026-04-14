// src/views/Checkout.tsx
//
// Full-page checkout view — wires venture context (NavRail), Clerk user, and
// the payment router through CheckoutFlow. Destination charges to the
// venture's Stripe Connect account are applied automatically at the server
// layer when the venture has venture_stripe_accounts.charges_enabled=true.

import { useEffect, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useCommerceSurfaceStore } from '../stores/commerce-surface';
import { PageShell, PageHeader, GlassCard, Badge } from '../components/ui';
import { CheckoutFlow } from '../components/commerce/checkout';
import type { OrderConfirmation } from '../lib/commerce/checkout-service';
import { useNavigation } from '../stores/navigation';
import { useToast } from '../components/Toasts';

export default function Checkout() {
  const { mode, activeVenture } = useNavigation();
  const { user, isLoaded: userLoaded } = useUser();
  const { toast } = useToast();
  const { cart, cartLoading, createCart } = useCommerceSurfaceStore();

  // Resolve venture from nav store. Default to 'mcv' only when no venture
  // context exists (global mode with no active venture).
  const ventureId = useMemo(
    () => (mode === 'venture' && activeVenture ? activeVenture : 'mcv'),
    [mode, activeVenture],
  );

  // Ensure cart exists for the active venture. Recreate if venture changes.
  useEffect(() => {
    if (cartLoading) return;
    if (!cart || cart.venture_id !== ventureId) {
      createCart(ventureId).catch((err: unknown) => {
        toast('error', err instanceof Error ? err.message : 'Failed to open cart');
      });
    }
  }, [ventureId, cart, cartLoading, createCart, toast]);

  function handleComplete(confirmation: OrderConfirmation) {
    toast('success', `Order ${confirmation.orderNumber} confirmed`);
    // CheckoutFlow shows the confirmation screen inline; we log + emit a
    // telemetry event. Follow-up work: write to notifications + Fabric.
    if (import.meta.env.DEV) {
      console.info('[Checkout] Order confirmed:', confirmation);
    }
  }

  return (
    <PageShell scroll>
      <PageHeader title="Checkout" subtitle={`Venture: ${ventureId}`} loading={cartLoading}>
        {user && (
          <Badge size="sm">
            {user.primaryEmailAddress?.emailAddress || user.username || 'signed in'}
          </Badge>
        )}
      </PageHeader>

      {!userLoaded && (
        <GlassCard style={{ margin: '0 20px', padding: 16 }}>
          Waiting for authentication…
        </GlassCard>
      )}

      {userLoaded && !user && (
        <GlassCard style={{ margin: '0 20px', padding: 16 }}>
          You need to sign in to complete a purchase.
        </GlassCard>
      )}

      {userLoaded && user && (
        <CheckoutFlow
          ventureId={ventureId}
          customerId={user.id}
          onComplete={handleComplete}
        />
      )}
    </PageShell>
  );
}
