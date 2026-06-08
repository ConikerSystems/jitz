/* Jitz service worker — caches the app shell + moves.json so the UI works
   offline. Videos are cross-origin (YouTube) and always require the network. */
const VERSION = "jitz-v2";          // bump to invalidate old caches on deploy
const SHELL = [
  "./",
  "index.html",
  "about.html",
  "manifest.webmanifest",
  "moves.json",
  "static/css/style.css",
  "static/js/app.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Only handle our own origin; let YouTube/etc. go straight to the network.
  if (url.origin !== self.location.origin) return;

  // moves.json: network-first so freshly curated videos show up, cache fallback offline.
  if (url.pathname.endsWith("moves.json")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Everything else (shell): cache-first, fall back to network, then to index.html for navigations.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          if (req.mode === "navigate") return caches.match("index.html");
        });
    })
  );
});
