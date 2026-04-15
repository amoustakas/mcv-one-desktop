import type { KitManifest } from './types';

// ---------------------------------------------------------------------------
// Kit Registry Client
// ---------------------------------------------------------------------------
// Client-side API for the kit registry endpoint. Apps mount the registry
// route at `/api/kit-registry` by default; override with setRegistryApiUrl.

let REGISTRY_API_URL = '/api/kit-registry';

/** Override the registry endpoint URL. Apps with non-standard mount paths
 * call this once at startup; defaults to '/api/kit-registry'. */
export function setRegistryApiUrl(url: string): void {
  REGISTRY_API_URL = url;
}

interface RegistryKit {
  kit_id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  manifest?: KitManifest;
  downloads?: number;
  created_at?: string;
}

interface InstalledKit {
  kit_id: string;
  enabled: boolean;
  config: Record<string, unknown>;
  installed_at: string;
  kits: {
    name: string;
    version: string;
    description: string;
    author: string;
    manifest: KitManifest;
  };
}

async function postRegistry(body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(REGISTRY_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

/** Search the registry for kits matching a query */
export async function searchKits(query: string): Promise<RegistryKit[]> {
  const data = await postRegistry({ action: 'search', q: query }) as { kits: RegistryKit[] };
  return data.kits;
}

/** Get a single kit's full details */
export async function getKit(kitId: string): Promise<RegistryKit | null> {
  const data = await postRegistry({ action: 'get', id: kitId }) as { kit: RegistryKit | null };
  return data.kit;
}

/** List all available kits */
export async function listKits(): Promise<RegistryKit[]> {
  const data = await postRegistry({ action: 'list' }) as { kits: RegistryKit[] };
  return data.kits;
}

/**
 * Optional audit callback for kit lifecycle events. Plain-TS callers that
 * have access to an audit publisher (e.g. a React component passing
 * `useFabricAudit()`'s return value) can thread it through install/uninstall
 * so every kit lifecycle event lands in the observability pipeline
 * without the SDK taking a hard dependency on Fabric.
 *
 * Fire-and-forget; the SDK never awaits it and errors are swallowed.
 */
export type RegistryAuditFn = (type: string, data?: Record<string, unknown>) => void;

function safeAudit(fn: RegistryAuditFn | undefined, type: string, data?: Record<string, unknown>): void {
  if (!fn) return;
  try { fn(type, data); } catch { /* audit must never break kit ops */ }
}

/** Install a kit for the current user */
export async function installKit(kitId: string, onAudit?: RegistryAuditFn): Promise<void> {
  await postRegistry({ action: 'install', kitId });
  safeAudit(onAudit, 'kit.installed', { kitId });
}

/** Uninstall a kit */
export async function uninstallKit(kitId: string, onAudit?: RegistryAuditFn): Promise<void> {
  await postRegistry({ action: 'uninstall', kitId });
  safeAudit(onAudit, 'kit.uninstalled', { kitId });
}

/** List user's installed kits */
export async function getInstalledKits(): Promise<InstalledKit[]> {
  const data = await postRegistry({ action: 'list-installed' }) as { installed: InstalledKit[] };
  return data.installed;
}

/** Publish a kit to the registry */
export async function publishKit(manifest: KitManifest, bundlePath?: string): Promise<void> {
  await postRegistry({ action: 'publish', manifest, bundle_path: bundlePath });
}
