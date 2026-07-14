const CACHE_NAME = "sideby-cache-v3";
const ASSETS = [
  "/manifest.json",
  "/favicon.ico",
  "/favicon-48x48.png",
  "/icon-192.png",
  "/icon.svg",
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
      fetch(e.request, { cache: "no-store" }).catch(() => fetch("/index.html", { cache: "no-store" }))
    );
    return;
  }

  // Stale-While-Revalidate Strategy for other static assets
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, cacheCopy);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Suppress fetch errors when offline
      });
      return cachedResponse || fetchPromise;
    })
  );
});
