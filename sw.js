
/* GAMERYT Calendar Service Worker */
const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `gameryt-calendar-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `gameryt-calendar-runtime-${CACHE_VERSION}`;

// Core assets to pre-cache (App Shell)
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  // Icons (optional but recommended)
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (![STATIC_CACHE, RUNTIME_CACHE].includes(key)) {
          return caches.delete(key);
        }
      }))
    ).then(() => self.clients.claim())
  );
});

// Network helpers
const isHtmlNavigation = (req) => req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept') && req.headers.get('accept').includes('text/html'));

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Don't try to handle non-GET
  if (req.method !== 'GET') {
    return;
  }

  // Avoid caching sync API calls explicitly
  if (url.pathname.startsWith('/api/sync')) {
    return; // let it go to the network
  }

  // App shell navigation fallback (offline-first for pages)
  if (isHtmlNavigation(req)) {
    event.respondWith(
      fetch(req).then((res) => {
        // Cache a copy of successful navigations
        const resClone = res.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, resClone)).catch(() => {});
        return res;
      }).catch(() => {
        // Offline: return cached page, fallback to app shell
        return caches.match(req).then((match) => match || caches.match('./index.html'));
      })
    );
    return;
  }

  // Static assets (CSS/JS/images) - stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((networkRes) => {
        // Cache good responses
        if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
          const copy = networkRes.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return networkRes;
      }).catch(() => {
        // Offline and no cache? return cached if exists
        return cached;
      });
      return cached || fetchPromise;
    })
  );
});
