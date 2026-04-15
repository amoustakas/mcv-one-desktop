import { useEffect, useRef } from 'react';
import { useNavigation } from '../stores/navigation';
import { useOrganization } from '../lib/auth';
import { apiPost } from '../lib/api/client';

type VentureRow = { id: string; clerk_org_id?: string | null };

/**
 * Reverse sync: when Clerk's active organization changes (e.g. user picks an
 * org in <OrganizationSwitcher/>), find the venture whose clerk_org_id matches
 * and flip the navigation store's activeVenture to match.
 *
 * Complements use-clerk-venture-sync.ts, which does the nav -> Clerk direction.
 * Together they close the bidirectional loop so the venture-scoped UI stays
 * coherent regardless of which control the user touches.
 *
 * No-op when the active org doesn't map to any venture (e.g. root org).
 */
export function useVentureFromClerk() {
  const { organization, isLoaded } = useOrganization();
  const activeVenture = useNavigation(s => s.activeVenture);
  const switchToVenture = useNavigation(s => s.switchToVenture);
  const cacheRef = useRef<VentureRow[] | null>(null);
  const lastAppliedOrgRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    const orgId = organization?.id || null;
    if (!orgId) return;
    if (lastAppliedOrgRef.current === orgId) return;

    let cancelled = false;
    (async () => {
      try {
        let list = cacheRef.current;
        if (!list) {
          const data = await apiPost<{ ventures: VentureRow[] }>('/api/ventures', { action: 'list' });
          list = data?.ventures || [];
          cacheRef.current = list;
        }
        if (cancelled) return;
        const match = list.find(v => v.clerk_org_id === orgId);
        if (match && match.id !== activeVenture) {
          switchToVenture(match.id);
        }
        lastAppliedOrgRef.current = orgId;
      } catch (e) {
        console.warn('venture-from-clerk: lookup failed', e);
      }
    })();
    return () => { cancelled = true; };
  }, [isLoaded, organization?.id, activeVenture, switchToVenture]);
}
