import { useEffect } from 'react';
import { useNavigation } from '../../stores/navigation';
import { tagVentureContext } from './client';

/**
 * Subscribes to the navigation store and tags Sentry scope with the
 * current venture id. Mount once near the app root.
 *
 * Note (M5): mount TBD — Antigravity session owns App.tsx during the
 * marathon. Export ready, wire in the follow-up session.
 */
export function SentryVentureTag() {
  const ventureId = useNavigation((s) => s.activeVenture);
  useEffect(() => {
    tagVentureContext(ventureId ?? null);
  }, [ventureId]);
  return null;
}
