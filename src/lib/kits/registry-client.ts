import type { KitManifest } from './types';

// ---------------------------------------------------------------------------
// Kit Registry Client
// ---------------------------------------------------------------------------
// Client-side API for the kit registry endpoint.

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
  const res = await fetch('/api/kit-registry', {
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

/** Install a kit for the current user */
export async function installKit(kitId: string): Promise<void> {
  await postRegistry({ action: 'install', kitId });
}

/** Uninstall a kit */
export async function uninstallKit(kitId: string): Promise<void> {
  await postRegistry({ action: 'uninstall', kitId });
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
