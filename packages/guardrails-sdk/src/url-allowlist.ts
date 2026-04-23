// packages/guardrails-sdk/src/url-allowlist.ts
//
// Extract every URL from a text payload and classify each one against a
// configured host allowlist. Used on both ingress (user may have included
// malicious links) and egress (model may have generated links pointing to
// spoofed or data-exfil hosts). The allowlist is venture-scoped and comes
// from the caller — this module is policy-mechanical, not policy-source.

import type { Violation } from './types.js';

const URL_REGEX = /\b(?:https?:\/\/|www\.)[^\s<>()"']+/gi;

function truncate(s: string, max = 200): string {
  return s.length <= max ? s : s.slice(0, max) + '…';
}

function hostOf(raw: string): string | null {
  try {
    const u = new URL(raw.startsWith('www.') ? `https://${raw}` : raw);
    return u.host.toLowerCase();
  } catch {
    return null;
  }
}

function hostMatchesAllowlist(host: string, allowlist: string[]): boolean {
  for (const entry of allowlist) {
    const e = entry.toLowerCase();
    if (host === e) return true;
    // Subdomain match: `*.example.com` or bare `example.com` implicitly matches subdomains.
    if (e.startsWith('*.') && host.endsWith(e.slice(1))) return true;
    if (!e.includes('*') && host.endsWith('.' + e)) return true;
  }
  return false;
}

/**
 * Known malware / phishing host suffixes. Intentionally short — the real
 * signal is the allowlist. This is a belt-and-suspenders backstop.
 */
const KNOWN_MALICIOUS_SUFFIXES = [
  '.onion',              // Tor hidden services in a corporate allowlist = always suspicious
  '.zip',                // TLD abused for phishing; legitimate zip-TLD domains should be explicitly allowlisted
];

export interface UrlPolicyOptions {
  allowlist?: string[];
  /** If true, flag every URL as violation when no allowlist is configured. Default false. */
  strictNoAllowlist?: boolean;
}

export function enforceUrlAllowlist(text: string, opts: UrlPolicyOptions = {}): Violation[] {
  if (!text) return [];
  const out: Violation[] = [];
  const allowlist = opts.allowlist ?? [];

  for (const m of text.matchAll(URL_REGEX)) {
    const raw = m[0];
    const host = hostOf(raw);
    if (!host) continue;

    // Known-malicious suffix check first (independent of allowlist).
    for (const suf of KNOWN_MALICIOUS_SUFFIXES) {
      if (host.endsWith(suf)) {
        out.push({
          kind: 'malicious_url',
          severity: 'high',
          patternId: 'url.malicious_tld',
          match: truncate(raw),
          offset: m.index,
        });
        break;
      }
    }

    if (allowlist.length === 0) {
      if (opts.strictNoAllowlist) {
        out.push({
          kind: 'off_allowlist_url',
          severity: 'medium',
          patternId: 'url.strict_no_allowlist',
          match: truncate(raw),
          offset: m.index,
        });
      }
      continue;
    }

    if (!hostMatchesAllowlist(host, allowlist)) {
      out.push({
        kind: 'off_allowlist_url',
        severity: 'medium',
        patternId: 'url.off_allowlist',
        match: truncate(raw),
        offset: m.index,
      });
    }
  }

  return out;
}
