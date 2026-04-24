// src/hooks/use-now.ts
//
// Render-safe "current time" hook. React 19's react-hooks/purity rule
// forbids Date.now() during render because it yields non-deterministic
// output between renders. useSyncExternalStore is the documented escape
// hatch for subscribing to external state (here, the wall clock), so
// callers get a value that's stable within a render and updates on a
// fixed cadence for TTL comparisons (e.g. "is this invite expired?").

import { useSyncExternalStore } from 'react';

const DEFAULT_INTERVAL_MS = 60_000;

export function useNow(intervalMs: number = DEFAULT_INTERVAL_MS): number {
  return useSyncExternalStore(
    (notify) => {
      const id = setInterval(notify, intervalMs);
      return () => clearInterval(id);
    },
    () => Date.now(),
    () => 0,
  );
}
