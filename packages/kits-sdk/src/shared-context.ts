// ---------------------------------------------------------------------------
// Kit Shared Context — Inter-Kit Communication
// ---------------------------------------------------------------------------
// Key-value store enabling kits to share data without direct coupling.
// Write-through strategy: localStorage for instant local reads,
// server sync (relative URL `/api/kit-context` by default) for cross-device.

const STORAGE_PREFIX = 'mcv-kit-ctx:';

let SHARED_CONTEXT_API_URL = '/api/kit-context';

/** Override the server-sync endpoint URL. Apps with non-standard mount paths
 * call this once at startup; defaults to '/api/kit-context'. */
export function setSharedContextApiUrl(url: string): void {
  SHARED_CONTEXT_API_URL = url;
}

interface ContextEntry {
  value: unknown;
  kitId: string;
  ventureId?: string;
  expiresAt?: number;
  createdAt: number;
}

// Background sync to Supabase (fire-and-forget)
async function syncToServer(action: string, body: Record<string, unknown>): Promise<void> {
  try {
    await fetch(SHARED_CONTEXT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
    });
  } catch {
    // Silently fail — localStorage is the primary store
  }
}

/** Save a value to the shared context (local + server sync) */
export function setContext(
  key: string,
  value: unknown,
  opts: { kitId: string; ventureId?: string; ttlMs?: number },
): void {
  const entry: ContextEntry = {
    value,
    kitId: opts.kitId,
    ventureId: opts.ventureId,
    expiresAt: opts.ttlMs ? Date.now() + opts.ttlMs : undefined,
    createdAt: Date.now(),
  };
  // Local write (instant)
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  // Server sync (background)
  syncToServer('set', { key, value, kitId: opts.kitId, ventureId: opts.ventureId, ttlMs: opts.ttlMs });
}

/** Get a value from the shared context (local-first) */
export function getContext(key: string): unknown | null {
  const raw = localStorage.getItem(STORAGE_PREFIX + key);
  if (!raw) return null;

  try {
    const entry: ContextEntry = JSON.parse(raw);
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      localStorage.removeItem(STORAGE_PREFIX + key);
      syncToServer('delete', { key });
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

/** Get full context entry (including metadata) */
export function getContextEntry(key: string): ContextEntry | null {
  const raw = localStorage.getItem(STORAGE_PREFIX + key);
  if (!raw) return null;

  try {
    const entry: ContextEntry = JSON.parse(raw);
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      localStorage.removeItem(STORAGE_PREFIX + key);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

/** Query context entries matching a key prefix */
export function queryContext(prefix: string): Array<{ key: string; entry: ContextEntry }> {
  const results: Array<{ key: string; entry: ContextEntry }> = [];
  const fullPrefix = STORAGE_PREFIX + prefix;

  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i);
    if (!storageKey?.startsWith(fullPrefix)) continue;

    const raw = localStorage.getItem(storageKey);
    if (!raw) continue;

    try {
      const entry: ContextEntry = JSON.parse(raw);
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        localStorage.removeItem(storageKey);
        continue;
      }
      const key = storageKey.slice(STORAGE_PREFIX.length);
      results.push({ key, entry });
    } catch {
      continue;
    }
  }

  return results;
}

/** Delete a context entry (local + server) */
export function deleteContext(key: string): void {
  localStorage.removeItem(STORAGE_PREFIX + key);
  syncToServer('delete', { key });
}

/** Delete all context entries for a specific kit */
export function clearKitContext(kitId: string): void {
  const toRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i);
    if (!storageKey?.startsWith(STORAGE_PREFIX)) continue;

    const raw = localStorage.getItem(storageKey);
    if (!raw) continue;

    try {
      const entry: ContextEntry = JSON.parse(raw);
      if (entry.kitId === kitId) {
        toRemove.push(storageKey);
      }
    } catch {
      continue;
    }
  }

  for (const key of toRemove) {
    localStorage.removeItem(key);
  }
  syncToServer('clear-kit', { kitId });
}

/** Pull context from server to local (call on app boot for cross-device sync) */
export async function syncFromServer(ventureId?: string): Promise<void> {
  try {
    const res = await fetch(SHARED_CONTEXT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'query', prefix: '', ventureId }),
    });
    if (!res.ok) return;
    const { entries } = await res.json();
    for (const entry of entries ?? []) {
      const local: ContextEntry = {
        value: entry.value,
        kitId: entry.kit_id,
        ventureId: entry.venture_id,
        expiresAt: entry.expires_at ? new Date(entry.expires_at).getTime() : undefined,
        createdAt: new Date(entry.created_at).getTime(),
      };
      localStorage.setItem(STORAGE_PREFIX + entry.key, JSON.stringify(local));
    }
  } catch {
    // Offline — use whatever's in localStorage
  }
}
