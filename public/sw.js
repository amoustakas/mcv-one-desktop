// MCV One Desktop — Service Worker v10
// NETWORK-ONLY for HTML/JS/CSS. Cache only static assets.
// This ensures the installed PWA always gets fresh content.

const CACHE_VERSION = 13;
const CACHE_NAME = `mcv-v${CACHE_VERSION}`;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => clients.forEach((c) => c.postMessage({ type: 'SW_UPDATED' })))
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept API calls or non-GET
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') return;

  // Static assets only (icons, fonts, images) — cache-first
  if (url.pathname.match(/\.(svg|png|jpg|woff2?|ico)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached || fetch(event.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          return res;
        })
      )
    );
    return;
  }

  // Everything else (HTML, JS, CSS) — network only, no caching
  // This means the PWA always loads fresh content when online
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
