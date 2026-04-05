// ---------------------------------------------------------------------------
// Kit Shared Context — Inter-Kit Communication
// ---------------------------------------------------------------------------
// Key-value store enabling kits to share data without direct coupling.
// Uses localStorage for now; can be upgraded to Supabase for cross-device sync.

const STORAGE_PREFIX = 'mcv-kit-ctx:';

interface ContextEntry {
  value: unknown;
  kitId: string;
  ventureId?: string;
  expiresAt?: number;
  createdAt: number;
}

/** Save a value to the shared context */
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
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
}

/** Get a value from the shared context */
export function getContext(key: string): unknown | null {
  const raw = localStorage.getItem(STORAGE_PREFIX + key);
  if (!raw) return null;

  try {
    const entry: ContextEntry = JSON.parse(raw);

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      localStorage.removeItem(STORAGE_PREFIX + key);
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

      // Skip expired
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

/** Delete a context entry */
export function deleteContext(key: string): void {
  localStorage.removeItem(STORAGE_PREFIX + key);
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
}
