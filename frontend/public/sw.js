const CACHE_NAME = "sideby-cache-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/sideby.ico",
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
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener("fetch", (e) => {
  // Only handle GET requests
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

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

  // Handle SPA routing: serve index.html for navigation requests
  if (e.request.mode === "navigate") {
    e.respondWith(
      caches.match("/index.html").then((cachedResponse) => {
        return cachedResponse || fetch(e.request);
      })
    );
    return;
  }

  // Stale-While-Revalidate Strategy for other static assets
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
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
