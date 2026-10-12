/**
 * SideBy service worker (vite-plugin-pwa injectManifest strategy).
 *
 * Caching policy (production-safe):
 * - App shell (index.html + hashed assets) is revisioned via workbox precache.
 * - /api/* requests are ALWAYS network-only. Comparison results must never be
 *   served from a cache, otherwise an offline page could display stale data
 *   as current.
 * - Static assets use stale-while-revalidate / cache-first with expirations.
 * - SPA navigations fall back to the precached shell when the network fails.
 *
 * Push: notifications are only shown for validated payloads carrying an
 * explicit type; clicking opens the deep-linked comparison URL on the
 * same origin.
 */
/// <reference lib="webworker" />

import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { CacheFirst, NetworkOnly, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { clientsClaim } from "workbox-core";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: ReadonlyArray<{ url: string; revision: string | null }>;
};

// ─── Push payload contract ──────────────────────────────────────────────────

const NOTIFICATION_TYPES = [
  "comparison.completed",
  "comparison.failed",
  "test",
] as const;

type NotificationType = (typeof NOTIFICATION_TYPES)[number];

interface SideByPushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
  type: NotificationType;
  comparisonId?: string;
}

const isNotificationType = (value: unknown): value is NotificationType =>
  typeof value === "string" && (NOTIFICATION_TYPES as readonly string[]).includes(value);

/**
 * Defensive validation — the SW never trusts raw push JSON. Returns null for
 * anything that is not a well-formed SideBy payload pointing at this origin.
 */
function parseSideByPushPayload(raw: unknown): SideByPushPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<Record<keyof SideByPushPayload, unknown>>;

  if (typeof candidate.title !== "string" || candidate.title.trim().length === 0) return null;
  if (candidate.title.length > 200) return null;
  if (typeof candidate.body !== "string" || candidate.body.trim().length === 0) return null;
  if (candidate.body.length > 500) return null;
  if (!isNotificationType(candidate.type)) return null;
  if (typeof candidate.url !== "string" || candidate.url.length === 0) return null;

  // Only allow same-origin targets: relative paths or absolute URLs on this origin.
  try {
    const target = new URL(candidate.url, self.location.origin);
    if (target.origin !== self.location.origin) return null;
    if (target.protocol !== "https:" && target.protocol !== "http:") return null;
  } catch {
    return null;
  }

  const payload: SideByPushPayload = {
    title: candidate.title,
    body: candidate.body,
    url: candidate.url,
    type: candidate.type,
  };

  if (typeof candidate.tag === "string" && candidate.tag.length > 0 && candidate.tag.length <= 120) {
    payload.tag = candidate.tag;
  }
  if (
    typeof candidate.comparisonId === "string" &&
    candidate.comparisonId.length > 0 &&
    candidate.comparisonId.length <= 64
  ) {
    payload.comparisonId = candidate.comparisonId;
  }

  return payload;
}

// ─── Precache + routing ─────────────────────────────────────────────────────

precacheAndRoute(self.__WB_MANIFEST);

cleanupOutdatedCaches();

// SPA navigations: serve the precached application shell (index.html) for
// client-side routing. Explicitly exclude API routes, auth callbacks, and webhooks.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("index.html"), {
    denylist: [
      /^\/api($|\/)/,
      /^\/auth\/callback/,
      /^\/auth\/.*-callback/,
      /^\/webhooks($|\/)/,
    ],
  }),
);

// ─── Runtime caching ────────────────────────────────────────────────────────

// API responses (both relative and cross-origin) are strictly network-only.
// Comparison results, user research, and mutations must NEVER be cached by the service worker.
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/") || url.pathname === "/api",
  new NetworkOnly(),
);

// Same-origin static assets (hashed bundles, icons): serve from cache when
// available, refresh in the background.
registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/assets/") ||
      /\.(png|ico|svg|woff2?)$/.test(url.pathname)) &&
    request.method === "GET",
  new StaleWhileRevalidate({
    cacheName: "sideby-static-assets",
    plugins: [
      new ExpirationPlugin({ maxEntries: 120, purgeOnQuotaError: true }),
      new CacheableResponsePlugin({ statuses: [200] }),
    ],
  }),
);

// Cross-origin public images and font files (Google Fonts, static CDN assets):
// Cache-first with expiration. Exclude signed or authenticated asset URLs.
registerRoute(
  ({ request, url }) => {
    if (url.origin === self.location.origin) return false;
    if (request.method !== "GET") return false;
    if (
      url.searchParams.has("token") ||
      url.searchParams.has("signature") ||
      url.searchParams.has("sig") ||
      url.searchParams.has("auth")
    ) {
      return false;
    }
    const isFont = url.hostname.endsWith("fonts.gstatic.com") || /\.(woff2?)$/.test(url.pathname);
    const isPublicImage = /\.(png|jpe?g|webp|gif|svg)$/.test(url.pathname);
    return isFont || isPublicImage;
  },
  new CacheFirst({
    cacheName: "sideby-cross-origin-assets",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true,
      }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

// ─── Lifecycle ──────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Remove caches left behind by the legacy hand-rolled service worker.
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys
          .filter((key) => key.startsWith("sideby-cache-"))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

// ─── Web Push ───────────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  let rawPayload: unknown = null;
  try {
    rawPayload = event.data ? event.data.json() : null;
  } catch {
    rawPayload = null;
  }

  const payload = parseSideByPushPayload(rawPayload);
  if (!payload) {
    // Unknown or malformed payloads are dropped silently instead of showing
    // a broken notification.
    return;
  }

  const targetUrl = new URL(payload.url, self.location.origin).toString();

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon-192.png",
      badge: "/icon-maskable-192.png",
      tag: payload.tag ?? `sideby:${payload.type}`,
      data: {
        url: targetUrl,
        type: payload.type,
        comparisonId: payload.comparisonId ?? null,
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data as { url?: unknown } | undefined;
  const target =
    typeof data?.url === "string" && data.url.length > 0
      ? data.url
      : "/app";

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Focus an existing window when possible; navigate it to the target so
      // the notification deep-link still lands on the right comparison.
      for (const client of windowClients) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client && client.url !== target) {
            try {
              await client.navigate(target);
            } catch {
              await self.clients.openWindow(target);
            }
          }
          return;
        }
      }

      await self.clients.openWindow(target);
    })(),
  );
});

// When the push subscription is refreshed by the browser (silent rotation),
// tell open clients so they can re-register the subscription server-side.
self.addEventListener("pushsubscriptionchange", (event) => {
  (event as ExtendableEvent).waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({ type: "window" });
      await Promise.all(
        windowClients.map((client) =>
          client.postMessage({ type: "push-subscription-changed" }),
        ),
      );
    })(),
  );
});

export {};
