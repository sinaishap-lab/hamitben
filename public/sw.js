// המתבן – Service Worker
// Goals (spec §20.2):
//   1. App shell precache so the home page works offline
//   2. Stale-while-revalidate for /catalog and tool API responses
//   3. Network-first for everything else with cache fallback
//   4. Web push handler with click-to-focus

const VERSION = "v1";
const SHELL_CACHE = `hamitben-shell-${VERSION}`;
const DATA_CACHE = `hamitben-data-${VERSION}`;
const SHELL_ASSETS = [
  "/",
  "/manifest.json",
  "/icon-192.svg",
  "/icon-512.svg",
  "/logo.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== DATA_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

function isStaleWhileRevalidateTarget(url) {
  if (url.pathname.startsWith("/api/tools")) return true;
  if (url.pathname.startsWith("/catalog")) return true;
  if (url.hostname === "res.cloudinary.com") return true;
  return false;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DATA_CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);
  return cached || (await networkPromise) || new Response("offline", { status: 503 });
}

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    if (res && res.ok && request.method === "GET") {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response("offline", { status: 503 });
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Same-origin only for shell. Cloudinary handled via SWR explicitly.
  if (url.origin !== self.location.origin && url.hostname !== "res.cloudinary.com") {
    return;
  }

  // Never cache auth + payment flows
  if (url.pathname.startsWith("/api/auth") || url.pathname.startsWith("/api/payments")) {
    return;
  }

  if (isStaleWhileRevalidateTarget(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default: network first, fall back to cache for navigation requests
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
  }
});

// Push notification handler — payload shape comes from lib/notifications/push.ts
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "המתבן", body: event.data.text() };
  }

  const title = payload.title || "המתבן";
  const options = {
    body: payload.body || "",
    icon: "/icon-192.svg",
    badge: "/icon-192.svg",
    dir: "rtl",
    lang: "he",
    data: { url: payload.url || "/" },
    tag: payload.tag,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // Focus an existing tab on the same origin if available
      for (const client of allClients) {
        if (new URL(client.url).origin === self.location.origin) {
          await client.focus();
          await client.navigate(url);
          return;
        }
      }
      await self.clients.openWindow(url);
    })()
  );
});
