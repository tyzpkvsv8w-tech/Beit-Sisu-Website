// ReKit service worker.
// Makes the site installable and shows an offline page when there's no connection.
// Privacy: it only stores files that are the same for everyone (the site's code, styles,
// fonts, icons and the offline page). Pages, messages and account data are never stored.
const VERSION = "v1";
const STATIC_CACHE = `rekit-static-${VERSION}`;
const PRECACHE = ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("rekit-") && k !== STATIC_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Files that never change once published: safe to serve from the device first.
function isStaticAsset(url) {
  if (url.origin === self.location.origin) return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");
  return url.hostname === "fonts.gstatic.com" || url.hostname === "fonts.googleapis.com";
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (req.mode === "navigate") {
    // Always fetch pages fresh; fall back to the offline page only when the network fails.
    event.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok || res.type === "opaque") cache.put(req, res.clone());
        return res;
      }),
    );
  }
  // Everything else (API calls, photos, server actions) goes straight to the network.
});
