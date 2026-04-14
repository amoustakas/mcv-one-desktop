import { useEffect } from 'react';
import { applyBrandTokens, resolveVentureByHost } from '../lib/ventures/white-label';
import type { Venture } from '../lib/ventures';

/**
 * Apply per-venture branding based on the current hostname.
 *
 * When the app is served from a venture's custom domain (or primary domain),
 * this hook detects the match and pushes brand tokens (--venture-primary,
 * --venture-accent, favicon) into <html>. On localhost / the fallback
 * mcv.one domain, no branding is overridden.
 *
 * Safe to call once at app root; re-runs on ventures list or location change.
 */
export function useWhiteLabel(ventures: Venture[]) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!ventures.length) return;

    const resolved = resolveVentureByHost(ventures, window.location.host);
    if (resolved) {
      applyBrandTokens(resolved.venture);
    }
  }, [ventures]);
}
