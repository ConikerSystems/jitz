/* Jitz service worker — NETWORK-FIRST so updates always show when online,
   with a cached copy as the offline fallback. Videos are cross-origin
   (YouTube) and always require the network. */
const VERSION = "jitz-v10";         // bump to invalidate old caches on deploy
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
  // Pre-cache the shell for offline use, then take over immediately.
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

  // Network-first: always try the live copy so new content shows up right away.
  // Cache the fresh response, and fall back to cache (or index.html) when offline.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => {
          if (cached) return cached;
          if (req.mode === "navigate") return caches.match("index.html");
          return Response.error();
        })
      )
  );
});
