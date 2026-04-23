import { initSentryClient } from './lib/sentry/client';
initSentryClient();

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import './lib/api'; // Install global fetch interceptor (must be before any components)
import { queryClient } from './lib/query';
import { AuthProvider } from './lib/auth';
import App from './App';
import './styles/design-system.css';
import './styles/components.css';
import './styles/shell.css';
import { Analytics, SpeedInsights, initWebVitals } from './lib/analytics';

// Register Core Web Vitals reporting (CLS/LCP/FCP/TTFB/INP → /api/web-vitals)
initWebVitals();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
);

// Service Worker — aggressive update strategy (PROD only).
// In dev, SW caching creates "I just rebuilt but UI is from yesterday" traps
// during rapid iteration. Gate registration on import.meta.env.PROD, and
// actively unregister any previously-installed SW + purge caches so users
// who previously loaded a prod build locally don't keep seeing stale shells.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    // Force update check on every page load by adding cache-bust param
    const reg = await navigator.serviceWorker.register('/sw.js', {
      updateViaCache: 'none',  // Never use HTTP cache for SW file
    });

    // Immediate update check
    reg.update();

    // Re-check every 30 seconds
    setInterval(() => reg.update(), 30_000);

    // When new SW found, tell it to skip waiting
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New content available — reload
          newWorker.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });

    // Reload when new SW activates
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SW_UPDATED' && !refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
} else if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  // Dev mode — purge any SW previously registered by a prod build loaded
  // against the same origin (localhost:5173 is shared by prod-preview and
  // `npm run dev`). Without this, the old SW keeps serving its cached
  // shell and the user sees stale UI for the entire dev session.
  window.addEventListener('load', async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) await reg.unregister();
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  });
}
