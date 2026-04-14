import { useEffect, useRef } from 'react';
import { useNavigation } from '../stores/navigation';
import { useOrganizationList } from '../lib/auth';
import { apiPost } from '../lib/api/client';
import type { Venture } from '../lib/ventures';

/**
 * Keeps Clerk's "active organization" in sync with the navigation store's
 * activeVenture. When a user switches to a venture that has a dedicated
 * Clerk tenant (clerk_org_id set), Clerk's active org is flipped to match —
 * which makes useOrganization() return the right org everywhere in the app
 * and makes RLS queries carry the correct org_id JWT claim.
 *
 * When the venture has no dedicated org (still on shared root), we leave
 * Clerk's active org alone — the user keeps their current context.
 */
export function useClerkVentureSync() {
  const activeVenture = useNavigation(s => s.activeVenture);
  const { setActive, isLoaded } = useOrganizationList();
  const lastSyncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !setActive) return;
    if (!activeVenture) return;
    if (lastSyncedRef.current === activeVenture) return;

    let cancelled = false;
    (async () => {
      try {
        const data = await apiPost<{ venture: Venture }>('/api/ventures', { action: 'get', id: activeVenture });
        if (cancelled) return;
        const orgId = data?.venture?.clerkOrgId;
        if (orgId) {
          await setActive({ organization: orgId });
        }
        lastSyncedRef.current = activeVenture;
      } catch (e) {
        console.warn('clerk-venture-sync: fetch failed', e);
      }
    })();
    return () => { cancelled = true; };
  }, [activeVenture, isLoaded, setActive]);
}
