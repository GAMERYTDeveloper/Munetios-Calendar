const CACHE_NAME = "munetios-calendar-new-v1";
const PRECACHE = [
  "./new/index.html",
  "./new/logo.png",
  "../manifest.webmanifest",
  "../icons/icon-192.png",
  "../icon/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        PRECACHE.map((url) =>
          fetch(url).then((resp) => {
            if (resp.ok) {
              return cache.put(url, resp);
            }
            console.warn("Skipping missing file:", url);
          }).catch(() => {
            console.warn("Failed to fetch:", url);
          })
        )
      )
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("./index.html"))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(event.request).then((resp) => {
          if (resp && resp.status === 200) {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, copy);
            });
          }
          return resp;
        });
      })
    );
  }
});
