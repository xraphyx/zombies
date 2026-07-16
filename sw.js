const CACHE_NAME = "kowa-static-v6";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=3.1.0",
  "./guide-data.js?v=3.1.0",
  "./config.js?v=3.1.0",
  "./app.js?v=3.1.0",
  "./manifest.webmanifest?v=3.1.0",
  "./icon.svg?v=3.1.0",
  "./icon-192.png?v=3.1.0",
  "./icon-512.png?v=3.1.0"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          const indexRequest = new Request(new URL("./index.html", self.registration.scope));
          caches.open(CACHE_NAME).then((cache) => cache.put(indexRequest, copy));
          return response;
        })
        .catch(async () => {
          const indexRequest = new Request(new URL("./index.html", self.registration.scope));
          return (await caches.match(indexRequest)) || (await caches.match("./"));
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
