// src/lib/analytics/index.ts
// Vercel Analytics + web-vitals instrumentation for MCV One Desktop.
// Client-only: no pino / node:* imports here.

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { onCLS, onLCP, onFCP, onTTFB, onINP, type Metric } from 'web-vitals';

export { Analytics, SpeedInsights };

/** Report web-vitals metrics to the console in dev and to /api/web-vitals in prod. */
export function initWebVitals() {
  const report = (metric: Metric) => {
    if (import.meta.env.DEV) {
      console.log('[web-vitals]', metric.name, metric.value, metric.rating);
    }
    // Best-effort beacon to structured pino logger endpoint.
    // Never block render on analytics failure.
    try {
      if ('navigator' in window && 'sendBeacon' in navigator) {
        const blob = new Blob(
          [JSON.stringify({ ...metric, path: window.location.pathname })],
          { type: 'application/json' },
        );
        navigator.sendBeacon('/api/web-vitals', blob);
      }
    } catch {
      // intentionally swallowed
    }
  };

  onCLS(report);
  onLCP(report);
  onFCP(report);
  onTTFB(report);
  onINP(report);
}

/** Emit a custom timing event (e.g., Factory flow-run latency). */
export function trackTiming(
  name: string,
  durationMs: number,
  meta?: Record<string, unknown>,
) {
  if (import.meta.env.DEV) {
    console.log('[timing]', name, durationMs, meta);
  }
  try {
    window.dispatchEvent(
      new CustomEvent('mcv:timing', { detail: { name, durationMs, meta } }),
    );
  } catch {
    // intentionally swallowed
  }
}
