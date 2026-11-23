// ReKit service worker.
// Makes the site installable and shows an offline page when there's no connection.
// Privacy: it only stores files that are the same for everyone (the site's code, styles,
// fonts, icons and the offline page). Pages, messages and account data are never stored.
const VERSION = "v2";
const STATIC_CACHE = `rekit-static-${VERSION}`;
const PRECACHE = ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png", "/icons/badge-72.png"];

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

// ---------- Notifications ----------

// A new message arrives. The payload is encrypted end to end by our server for this device.
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { /* not JSON: show a plain notification */ }
  const path = typeof data.url === "string" && data.url.startsWith("/") ? data.url : "/messages";
  event.waitUntil((async () => {
    // Already reading this conversation? Then there's nothing to tell them.
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    if (windows.some((w) => w.focused && w.visibilityState === "visible" && new URL(w.url).pathname === path)) return;
    await self.registration.showNotification(data.title || "ReKit", {
      body: data.body || "",
      tag: data.tag || "rekit",       // same conversation: replace the previous notification
      renotify: true,                  // ...but still buzz for the new message
      lang: data.lang, dir: data.dir === "rtl" ? "rtl" : "ltr",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      data: { url: path },
    });
  })());
});

// Tapping a notification opens the conversation, reusing an open ReKit window if there is one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/messages", self.location.origin).href; // always this site
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of windows) {
      if (new URL(w.url).origin !== self.location.origin) continue;
      await w.focus();
      if ("navigate" in w) await w.navigate(url);
      return;
    }
    await self.clients.openWindow(url);
  })());
});

// Browsers occasionally renew subscriptions; tell the server about the new one.
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil((async () => {
    const sub = event.newSubscription || (event.oldSubscription && await self.registration.pushManager.subscribe(event.oldSubscription.options));
    if (!sub) return;
    await fetch("/api/push/subscription", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
  })());
});
