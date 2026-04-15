/**
 * White-Label runtime resolver.
 *
 * Given a hostname (e.g. app.betedge.ai), find the venture that claims it
 * (either as primary domain or within ventures.custom_domains), and return
 * the per-venture brand surface: colors, logo, Clerk appearance, doc_namespace.
 *
 * Pure functions — no fetches. Callers hydrate `ventures` once via
 * /api/ventures?action=list and call these to derive the active branding.
 */

import type { Venture, VentureWhiteLabel, VentureCustomDomain } from './types';

export interface ResolvedBrand {
  venture: Venture;
  /** The host that matched — useful for telemetry. */
  matchedHost: string;
  /** True if the match came from custom_domains (not primary domain). */
  isCustomDomain: boolean;
}

/**
 * Normalize a hostname — strip port, www prefix, lowercase.
 */
export function normalizeHost(host: string): string {
  return host.toLowerCase().split(':')[0].replace(/^www\./, '');
}

/**
 * Find the venture that claims a given hostname.
 * Order of preference: (1) exact primary `domain` match, (2) custom_domains hit.
 * Returns null if no venture claims this host.
 */
export function resolveVentureByHost(ventures: Venture[], host: string): ResolvedBrand | null {
  const h = normalizeHost(host);

  // Primary domain match
  for (const v of ventures) {
    if (v.domain && normalizeHost(v.domain) === h) {
      return { venture: v, matchedHost: h, isCustomDomain: false };
    }
  }

  // Custom-domains match
  for (const v of ventures) {
    const customs = v.customDomains ?? [];
    for (const cd of customs) {
      if (normalizeHost(cd.host) === h) {
        return { venture: v, matchedHost: h, isCustomDomain: true };
      }
    }
  }

  return null;
}

/**
 * Compute the effective brand tokens (CSS variables) for a venture.
 * Falls back to the venture's `color`/`accent` when `white_label` is empty.
 */
export function computeBrandTokens(venture: Venture): Record<string, string> {
  const wl: VentureWhiteLabel = venture.whiteLabel ?? {};
  return {
    '--venture-primary': wl.primaryColor ?? venture.color,
    '--venture-accent': wl.accentColor ?? venture.accent,
    '--venture-brand-name': `"${wl.brandName ?? venture.name}"`,
  };
}

/**
 * Apply brand tokens to document root. Safe to call on every location change.
 */
export function applyBrandTokens(venture: Venture): void {
  if (typeof document === 'undefined') return;
  const tokens = computeBrandTokens(venture);
  for (const [k, v] of Object.entries(tokens)) {
    document.documentElement.style.setProperty(k, v);
  }
  // Favicon swap, if configured
  const wl = venture.whiteLabel;
  if (wl?.faviconUrl) {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) link.href = wl.faviconUrl;
  }
}

/**
 * Resolve Clerk appearance for a venture — returns Clerk's expected shape
 * (variables + elements). Empty object if no white-label is configured.
 */
export function resolveClerkAppearance(venture: Venture): Record<string, unknown> {
  const wl = venture.whiteLabel ?? {};
  const baseColor = wl.primaryColor ?? venture.color ?? '#00F0FF';
  return {
    variables: {
      colorPrimary: baseColor,
      colorBackground: '#0F1629',
      colorInputBackground: '#0A1020',
      colorText: '#E8F0FE',
      colorTextSecondary: '#8899AA',
      borderRadius: '10px',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    elements: {
      logoImage: wl.logoUrl ? { src: wl.logoUrl } : undefined,
      formButtonPrimary: { background: baseColor, color: '#020408' },
      card: { background: 'var(--bg-card)', border: '1px solid var(--border)' },
    },
    ...(wl.clerkAppearance ?? {}),
  };
}

/**
 * Given a custom domain and a project host (e.g. `mcv.vercel.app`), return
 * the DNS records the operator needs to create. This is used by the
 * VentureDomainsPanel verification UX.
 */
export function computeRequiredDnsRecords(host: string, projectCname: string): Array<{ type: string; name: string; value: string; ttl: number }> {
  const h = normalizeHost(host);
  const isApex = !h.includes('.') || h.split('.').length === 2;

  if (isApex) {
    return [
      { type: 'A', name: '@', value: '76.76.21.21', ttl: 3600 },
      { type: 'AAAA', name: '@', value: '2606:4700:10::6816:1515', ttl: 3600 },
    ];
  }
  // Subdomain → CNAME to project host
  const subPart = h.split('.')[0];
  return [
    { type: 'CNAME', name: subPart, value: projectCname, ttl: 3600 },
  ];
}

/**
 * Summarize the verification status of a venture's custom domains.
 */
export function summarizeDomainHealth(ventures: Venture[]): {
  total: number;
  verified: number;
  pending: number;
  failed: number;
  byVenture: Record<string, { total: number; verified: number }>;
} {
  let total = 0, verified = 0, pending = 0, failed = 0;
  const byVenture: Record<string, { total: number; verified: number }> = {};
  for (const v of ventures) {
    const list: VentureCustomDomain[] = v.customDomains ?? [];
    let vVerified = 0;
    for (const d of list) {
      total++;
      if (d.status === 'verified') { verified++; vVerified++; }
      else if (d.status === 'failed') failed++;
      else pending++;
    }
    if (list.length > 0) byVenture[v.id] = { total: list.length, verified: vVerified };
  }
  return { total, verified, pending, failed, byVenture };
}
