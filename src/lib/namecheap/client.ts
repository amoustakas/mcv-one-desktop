/**
 * Namecheap API client — XML-over-HTTPS wrapper.
 *
 * Credentials are sourced from env:
 *   NAMECHEAP_API_USER   — Namecheap username (also used as ApiUser by default)
 *   NAMECHEAP_API_KEY    — generated in Namecheap dashboard (Profile → Tools → API Access)
 *   NAMECHEAP_CLIENT_IP  — public IP of the caller (MUST match a whitelisted IP on the account)
 *
 * Namecheap's API requires:
 *   1. IP whitelist per API user (add your public IP in the Namecheap dashboard)
 *   2. `ClientIp` query param that matches the whitelisted IP (Namecheap sanity-checks
 *      both the connecting socket IP AND the claimed ClientIp)
 *
 * Reference: https://www.namecheap.com/support/api/methods/domains/get-list/
 */

import { XMLParser } from 'fast-xml-parser';

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface NamecheapCreds {
  apiUser: string;      // typically same as userName
  apiKey: string;
  userName: string;
  clientIp: string;     // whitelisted public IP
  sandbox?: boolean;
}

export interface NamecheapDomain {
  /** Fully-qualified domain name (e.g. "mcv.one"). */
  name: string;
  /** Namecheap internal domain id. Stored in `registrar_ref` so we can cross-link. */
  id: string;
  /** ISO date the domain was registered with Namecheap. */
  created: string;
  /** ISO date the domain expires. */
  expires: string;
  /** Is the domain currently expired per Namecheap? */
  isExpired: boolean;
  /** Is the domain locked against transfer? */
  isLocked: boolean;
  /** Is WHOIS-Guard / privacy protection active? */
  isWhoisGuard: 'ENABLED' | 'DISABLED' | 'NOTPRESENT';
  /** Is auto-renew on? */
  autoRenew: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// Public IP detection helper
// ────────────────────────────────────────────────────────────────────────────

/**
 * Ask an external service for this machine's public IPv4 address. Used when
 * NAMECHEAP_CLIENT_IP isn't set explicitly — so the seed script can tell you
 * exactly which IP to whitelist on Namecheap.
 */
export async function detectPublicIp(): Promise<string> {
  const res = await fetch('https://api.ipify.org?format=json');
  if (!res.ok) throw new Error(`ipify returned HTTP ${res.status}`);
  const body = (await res.json()) as { ip?: string };
  if (!body.ip) throw new Error('ipify response missing ip field');
  return body.ip;
}

// ────────────────────────────────────────────────────────────────────────────
// Client factory
// ────────────────────────────────────────────────────────────────────────────

const PRODUCTION_BASE = 'https://api.namecheap.com/xml.response';
const SANDBOX_BASE = 'https://api.sandbox.namecheap.com/xml.response';

// fast-xml-parser preserves attributes (e.g. <Domain Name="..." ID="..." />)
// using the `@_` prefix so we can read them as first-class fields.
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
});

export function createNamecheapClient(creds: NamecheapCreds) {
  const base = creds.sandbox ? SANDBOX_BASE : PRODUCTION_BASE;

  async function call<T = unknown>(command: string, extra: Record<string, string> = {}): Promise<T> {
    const params = new URLSearchParams({
      ApiUser: creds.apiUser,
      ApiKey: creds.apiKey,
      UserName: creds.userName,
      ClientIp: creds.clientIp,
      Command: command,
      ...extra,
    });
    const url = `${base}?${params.toString()}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Namecheap HTTP ${res.status} for ${command}`);
    }
    const xml = await res.text();
    const parsed = xmlParser.parse(xml) as {
      ApiResponse?: {
        '@_Status'?: string;
        Errors?: { Error?: string | string[] | { '#text'?: string } };
        CommandResponse?: unknown;
      };
    };

    const api = parsed.ApiResponse;
    const status = api?.['@_Status'];
    if (status !== 'OK') {
      const errs = api?.Errors?.Error;
      const msg = Array.isArray(errs)
        ? errs.map((e) => (typeof e === 'string' ? e : e?.['#text'] ?? JSON.stringify(e))).join('; ')
        : typeof errs === 'string'
        ? errs
        : errs?.['#text'] ?? 'Unknown Namecheap error';
      throw new Error(`Namecheap ${command} failed: ${msg}`);
    }

    return api?.CommandResponse as T;
  }

  /**
   * List all domains on the account. Namecheap paginates at 100/page max.
   * This method auto-paginates and returns the full set.
   */
  async function listDomains(): Promise<NamecheapDomain[]> {
    const all: NamecheapDomain[] = [];
    let page = 1;
    // Safety cap — 100 pages × 100 domains = 10,000. More than Tony will ever
    // have personally; breaks an infinite loop if the API mis-reports TotalItems.
    while (page <= 100) {
      const resp = await call<{
        DomainGetListResult?: {
          Domain?: NamecheapDomainRaw | NamecheapDomainRaw[];
        };
        Paging?: { TotalItems?: number; CurrentPage?: number; PageSize?: number };
      }>('namecheap.domains.getList', {
        PageSize: '100',
        Page: String(page),
        ListType: 'ALL',
      });

      const domainsRaw = resp?.DomainGetListResult?.Domain;
      const domains: NamecheapDomainRaw[] = Array.isArray(domainsRaw)
        ? domainsRaw
        : domainsRaw
        ? [domainsRaw]
        : [];

      for (const d of domains) all.push(normalize(d));

      const paging = resp?.Paging;
      const total = Number(paging?.TotalItems ?? 0);
      const pageSize = Number(paging?.PageSize ?? 100);
      const pagesNeeded = Math.ceil(total / pageSize);
      if (page >= pagesNeeded) break;
      page++;
    }
    return all;
  }

  return { listDomains, call };
}

// ────────────────────────────────────────────────────────────────────────────
// Internals — raw shape + normalization
// ────────────────────────────────────────────────────────────────────────────

interface NamecheapDomainRaw {
  '@_ID'?: string;
  '@_Name'?: string;
  '@_User'?: string;
  '@_Created'?: string;   // MM/DD/YYYY
  '@_Expires'?: string;   // MM/DD/YYYY
  '@_IsExpired'?: string; // "true" | "false"
  '@_IsLocked'?: string;
  '@_AutoRenew'?: string;
  '@_WhoisGuard'?: string;
}

function normalize(d: NamecheapDomainRaw): NamecheapDomain {
  return {
    name: d['@_Name'] ?? '',
    id: d['@_ID'] ?? '',
    created: toIsoDate(d['@_Created']),
    expires: toIsoDate(d['@_Expires']),
    isExpired: d['@_IsExpired']?.toLowerCase() === 'true',
    isLocked: d['@_IsLocked']?.toLowerCase() === 'true',
    isWhoisGuard: (d['@_WhoisGuard'] as NamecheapDomain['isWhoisGuard']) ?? 'NOTPRESENT',
    autoRenew: d['@_AutoRenew']?.toLowerCase() === 'true',
  };
}

/**
 * Namecheap returns MM/DD/YYYY. Normalize to YYYY-MM-DD (Postgres-friendly).
 */
function toIsoDate(mmddyyyy?: string): string {
  if (!mmddyyyy) return '';
  const [mm, dd, yyyy] = mmddyyyy.split('/');
  if (!mm || !dd || !yyyy) return '';
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}
