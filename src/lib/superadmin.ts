/**
 * Super-admin device gate (bridge code).
 *
 * Mirrors the SuperAdminBar pattern from mcv-one-marketing
 * (src/devtools/DeviceGate.ts). Inlined here so VIL Session 3 ships
 * the Vision Broker cockpit panel behind the same access discipline
 * as the marketing-side overlay — restricted to Tony's Atlas
 * workstation + 2× Samsung mobile + Alienware laptop.
 *
 * Bridge-code rationale:
 *   - The canonical home is `@mcv/devtoolbar`, an extraction track
 *     parked behind the workspace-arch Phase D merge. When that lands
 *     (and adds WebAuthn-backed device verification), this file gets
 *     replaced by a one-line `import { isSuperAdmin } from '@mcv/devtoolbar'`.
 *   - Until then, the localStorage-flag check is identical to the
 *     marketing repo's gate so behavior stays consistent across
 *     surfaces (Tony unlocks once via `?mcv-dev=atlas`, all MCV
 *     surfaces honor it).
 *
 * Access paths (all fail-closed for unknown devices):
 *   - import.meta.env.DEV       — `npm run dev` always reaches the panel
 *   - localStorage['mcv:super-admin'] === one of UNLOCK_VALUES
 *   - URL `?mcv-dev=<device>`   — writes flag, then strips param
 *
 * NOTE: The gate is a synchronous `boolean` check. Components that
 * need to re-render on unlock changes should listen for the
 * `mcv:super-admin-changed` event on `window`.
 */

const STORAGE_KEY = 'mcv:super-admin';
const UNLOCK_VALUES = ['atlas', 'samsung-1', 'samsung-2', 'alienware'] as const;
type UnlockValue = (typeof UNLOCK_VALUES)[number];

function readStoredUnlock(): UnlockValue | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw && (UNLOCK_VALUES as readonly string[]).includes(raw)
      ? (raw as UnlockValue)
      : null;
  } catch {
    return null;
  }
}

function writeStoredUnlock(value: UnlockValue): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // localStorage blocked — gate stays closed (correct fail-closed).
  }
}

/**
 * Consume the `?mcv-dev=<device>` URL param on boot. Writes to
 * localStorage so subsequent visits persist, and strips the param
 * so it doesn't leak into shared screenshots / browser history.
 */
export function consumeUnlockParam(): UnlockValue | null {
  if (typeof window === 'undefined') return null;
  try {
    const url = new URL(window.location.href);
    const raw = url.searchParams.get('mcv-dev');
    if (!raw) return null;
    if (!(UNLOCK_VALUES as readonly string[]).includes(raw)) return null;
    const value = raw as UnlockValue;
    writeStoredUnlock(value);
    url.searchParams.delete('mcv-dev');
    window.history.replaceState({}, '', url.toString());
    window.dispatchEvent(new Event('mcv:super-admin-changed'));
    return value;
  } catch {
    return null;
  }
}

/**
 * Synchronous super-admin check. Intentionally does NOT trigger
 * re-renders on its own — host components can subscribe via the
 * `mcv:super-admin-changed` event for reactivity.
 */
export function isSuperAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  // Dev mode is always unlocked so the panel is reachable from any
  // local browser without needing the URL-param dance.
  if (import.meta.env.DEV) return true;
  return readStoredUnlock() !== null;
}

export function getDeviceLabel(): UnlockValue | 'dev' | null {
  if (typeof window === 'undefined') return null;
  if (import.meta.env.DEV) return 'dev';
  return readStoredUnlock();
}
