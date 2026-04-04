import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './lib/api'; // Install global fetch interceptor (must be before any components)
import { AuthProvider } from './lib/auth';
import App from './App';
import './styles/design-system.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);

// Service Worker — aggressive update strategy
if ('serviceWorker' in navigator) {
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
}
