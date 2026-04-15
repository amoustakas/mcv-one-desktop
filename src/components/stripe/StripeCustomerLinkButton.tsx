import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { Button } from '../ui';
import { apiPost } from '../../lib/api/client';
import { useToast } from '../Toasts';

interface StripeCustomerLinkButtonProps {
  /** Capital contact this Stripe customer will be linked to — stamps
   *  crm_contacts.metadata.stripe_customer_id so the Stripe adapter
   *  (Epic 13 S2) can auto-match payment_intent.succeeded events. */
  capitalContactId: string;
  /** Default email used for Stripe customer creation. Optional — Stripe
   *  accepts null and the dashboard lets admins add it later. */
  email?: string;
  /** Display name for the Stripe customer object. */
  name?: string;
  /** Called after the Stripe customer is created + CRM metadata stamped. */
  onLinked?: (result: { stripe_customer_id: string }) => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
}

/**
 * One-click Stripe customer provisioning + Capital link. Creates a new
 * Stripe Customer via /api/stripe and stamps the id on the Capital
 * contact's CRM metadata so inbound payment_intent.succeeded webhooks
 * can reconcile against open commitments.
 *
 * This is the card/ACH mirror of PlaidLinkButton (which handles wire /
 * ACH via Plaid). Use whichever rail the investor prefers — Capital's
 * reconcile pipeline accepts both.
 */
export default function StripeCustomerLinkButton({
  capitalContactId,
  email,
  name,
  onLinked,
  label = 'Link card on file',
  size = 'md',
  variant = 'primary',
}: StripeCustomerLinkButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const customer = await apiPost<{ id: string }>('/api/stripe', {
        action: 'create-customer',
        email,
        name,
        metadata: { capital_contact_id: capitalContactId },
      });
      if (!customer?.id) throw new Error('Stripe did not return a customer id');

      await apiPost('/api/capital', {
        action: 'link-stripe-customer',
        contact_id: capitalContactId,
        stripe_customer_id: customer.id,
      });

      toast('success', `Stripe customer linked`);
      onLinked?.({ stripe_customer_id: customer.id });
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Stripe link failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      icon={loading ? <Loader2 size={13} className="sclb-spin" /> : <CreditCard size={13} />}
      onClick={handleClick}
      disabled={loading || !capitalContactId}
    >
      {loading ? 'Linking…' : label}
      <style>{`.sclb-spin { animation: sclb-spin 1s linear infinite; } @keyframes sclb-spin { to { transform: rotate(360deg); } }`}</style>
    </Button>
  );
}
