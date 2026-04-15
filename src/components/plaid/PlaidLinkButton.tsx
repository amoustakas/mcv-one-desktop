import { useCallback, useEffect, useState } from 'react';
import { usePlaidLink, type PlaidLinkOnSuccess } from 'react-plaid-link';
import { Landmark, Loader2 } from 'lucide-react';
import { Button } from '../ui';
import { apiPost } from '../../lib/api/client';
import { useToast } from '../Toasts';

interface PlaidLinkButtonProps {
  /** Venture slug to scope the linked item to */
  ventureId?: string;
  /** Optional client-side user id; server falls back to Clerk userId */
  clientUserId?: string;
  /** Called after the public token is exchanged + item is persisted */
  onLinked?: (result: { item_id: string; access_token_present: boolean }) => void;
  /** When set, also stamps `crm_contacts.metadata.plaid_account_id` on this
   *  contact via /api/capital action=link-plaid-account so the PlaidAdapter
   *  (Epic 13 S1) can match incoming wires/ACH to the investor automatically. */
  capitalContactId?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
}

/**
 * One-click bank linking via Plaid Link. Handles link-token fetch, Plaid Link
 * hosted flow, public-token → access-token exchange + persistence to
 * plaid_items (server-side, encrypted). Caller gets a simple onLinked
 * callback.
 */
export default function PlaidLinkButton({
  ventureId,
  clientUserId,
  onLinked,
  capitalContactId,
  label = 'Link a bank account',
  size = 'md',
  variant = 'primary',
}: PlaidLinkButtonProps) {
  const { toast } = useToast();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch a link token when the button mounts.
  useEffect(() => {
    let cancelled = false;
    async function fetchToken() {
      try {
        const res = await apiPost<{ link_token: string; expiration: string }>(
          '/api/plaid',
          { action: 'create-link-token', client_user_id: clientUserId },
        );
        if (!cancelled) setLinkToken(res.link_token);
      } catch (e) {
        if (!cancelled) {
          toast('error', e instanceof Error ? e.message : 'Failed to create Plaid link token');
        }
      }
    }
    void fetchToken();
    return () => { cancelled = true; };
  }, [clientUserId, toast]);

  const onSuccess: PlaidLinkOnSuccess = useCallback(async (public_token, metadata) => {
    setLoading(true);
    try {
      const exchanged = await apiPost<{ item_id: string; access_token: string }>(
        '/api/plaid',
        {
          action: 'exchange-token',
          public_token,
          venture_id: ventureId,
          institution_id: metadata.institution?.institution_id,
          institution_name: metadata.institution?.name,
          persist: true,
        },
      );
      toast('success', `Linked ${metadata.institution?.name || 'bank'}`);

      // Capital reconciliation hook: stamp the contact's CRM metadata so
      // PlaidAdapter (Epic 13 S1) can auto-match incoming wires/ACH.
      // Best-effort — link still succeeds even if this stamp fails.
      if (capitalContactId && metadata.accounts?.[0]?.id) {
        try {
          await apiPost('/api/capital', {
            action: 'link-plaid-account',
            contact_id: capitalContactId,
            plaid_account_id: metadata.accounts[0].id,
          });
        } catch (linkErr) {
          console.warn('[plaid-link] capital link-plaid-account failed:', linkErr);
        }
      }

      onLinked?.({ item_id: exchanged.item_id, access_token_present: !!exchanged.access_token });
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Link exchange failed');
    } finally {
      setLoading(false);
    }
  }, [ventureId, onLinked, capitalContactId, toast]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit: (err) => {
      if (err) {
        toast('info', `Plaid Link closed: ${err.display_message || err.error_message || 'user exited'}`);
      }
    },
  });

  return (
    <Button
      variant={variant}
      size={size}
      icon={loading ? <Loader2 size={13} className="plb-spin" /> : <Landmark size={13} />}
      onClick={() => open()}
      disabled={!ready || !linkToken || loading}
    >
      {loading ? 'Exchanging…' : !linkToken ? 'Preparing…' : label}
      <style>{`.plb-spin { animation: plb-spin 1s linear infinite; } @keyframes plb-spin { to { transform: rotate(360deg); } }`}</style>
    </Button>
  );
}
