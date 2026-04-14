import { lazy, type ComponentType } from 'react';
/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Lazy-with-retry
// -----------------
// React.lazy() + dynamic import() can fail transiently for two common reasons:
//   1) Stale deploy: browser cached an old JS bundle that references chunk
//      hashes that no longer exist on the server (very common after rapid
//      Vercel redeploys). Dynamic import -> 404 -> "Loading chunk ... failed".
//   2) Transient network: one-off fetch failure, recovers on retry.
//
// This helper:
//   - Retries the import up to 2 times with exponential backoff
//   - On persistent failure detects "stale deploy" pattern and force-reloads
//     the page (once per minute max) so the user gets fresh HTML that
//     references the current chunk hashes.
//   - Preserves the React.lazy() API so call sites stay the same:
//       const Dialog = lazyRetry(() => import('./HeavyDialog'));
// ---------------------------------------------------------------------------

const RELOAD_KEY = 'mcv-lazy-reload-at';
const RELOAD_COOLDOWN_MS = 60_000;

function isChunkLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /Loading chunk \d+ failed/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /ChunkLoadError/i.test(msg) ||
    /Importing a module script failed/i.test(msg)
  );
}

function shouldReload(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    return true;
  } catch {
    return true;
  }
}

async function retry<T>(fn: () => Promise<T>, attempts = 2, delayMs = 300): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (attempts <= 0) throw err;
    await new Promise(r => setTimeout(r, delayMs));
    return retry(fn, attempts - 1, delayMs * 2);
  }
}

/**
 * Drop-in replacement for React.lazy() with stale-chunk resilience.
 * Uses `any` for the component type so it accepts components with arbitrary
 * prop shapes — matches React.lazy's own permissive typing.
 */
export function lazyRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): ReturnType<typeof lazy<T>> {
  return lazy<T>(async () => {
    try {
      return await retry(factory);
    } catch (err) {
      if (isChunkLoadError(err) && shouldReload()) {
        // eslint-disable-next-line no-console
        console.warn('[lazy-retry] Stale chunk detected, reloading page...', err);
        window.location.reload();
        return { default: (() => null) as unknown as T };
      }
      throw err;
    }
  });
}
