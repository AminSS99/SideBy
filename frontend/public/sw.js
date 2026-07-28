const CACHE_NAME = "sideby-cache-v6";
const ASSETS = [
  "/index.html",
  "/manifest.json",
  "/sideby.ico",
  "/favicon.ico",
  "/favicon-48x48.png",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon.svg",
  "/snapsolve.png",
];

// Install Event
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener("fetch", (e) => {
  // Only handle GET requests
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  if (!["http:", "https:"].includes(url.protocol) || url.origin !== self.location.origin) {
    return;
  }

  // Avoid intercepting API calls, Clerk auth endpoints, or PostHog/Sentry domains
  if (
    url.pathname.startsWith("/api") || 
    url.pathname.includes("clerk") || 
    url.hostname.includes("clerk") || 
    url.hostname.includes("posthog") || 
    url.hostname.includes("sentry")
  ) {
    return;
  }

  if (url.pathname.startsWith("/assets/") || url.pathname === "/sw.js") {
    return;
  }

  // Handle SPA routing with network-first HTML so hashed asset URLs never go stale.
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request, { cache: "no-store" }).catch(async () => {
        const cachedShell = await caches.match("/index.html");
        return cachedShell || new Response(
          "<!doctype html><title>SideBy is offline</title><p>Reconnect and refresh to continue.</p>",
          {
            status: 503,
            statusText: "Offline",
            headers: { "Content-Type": "text/html; charset=utf-8" },
          },
        );
      })
    );
    return;
  }

  // Stale-While-Revalidate Strategy for other static assets
  const fetchPromise = fetch(e.request).then(async (networkResponse) => {
    if (networkResponse.status === 200 && networkResponse.type === "basic") {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(e.request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);

  e.waitUntil(fetchPromise);
  e.respondWith(
    caches.match(e.request).then(async (cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      const networkResponse = await fetchPromise;
      return networkResponse || new Response("", {
        status: 503,
        statusText: "Offline",
      });
    })
  );
});
