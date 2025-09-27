const CACHE_NAME = "munetios-calendar-new-v2";
const PRECACHE = [
  "./new/index.html",
  "./new/logo.png",
  "./new/manifest.webmanifest"
];

// Install: cache core files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE)
    ).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for static, network-first for pages
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    // For HTML navigation
    event.respondWith(
      fetch(event.request).catch(() => caches.match("./new/index.html"))
    );
  } else {
    // For assets (images, CSS, JS)
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;

        return fetch(event.request).then((resp) => {
          if (resp && resp.status === 200 && resp.type === "basic") {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(event.request, copy)
            );
          }
          return resp;
        }).catch(() => {
          // Fallback for images (optional: serve logo.png)
          if (event.request.destination === "image") {
            return caches.match("./new/logo.png");
          }
        });
      })
    );
  }
});
