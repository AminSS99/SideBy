import posthog from "posthog-js";

const POSTHOG_KEY =
  import.meta.env.VITE_POSTHOG_KEY || import.meta.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  import.meta.env.VITE_POSTHOG_HOST ||
  import.meta.env.NEXT_PUBLIC_POSTHOG_HOST ||
  "https://us.i.posthog.com";

let initialized = false;
let pendingIdentity: { userId: string; traits?: Record<string, unknown> } | null = null;

export function initPostHog() {
  if (!POSTHOG_KEY) {
    return;
  }

  if (initialized) {
    posthog.opt_in_capturing();
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    ui_host: POSTHOG_HOST.includes("eu.") ? "https://eu.posthog.com" : undefined,
    defaults: "2025-05-24", // SPA-aware pageviews (history_change)
    person_profiles: "identified_only",
    loaded: (ph) => {
      if (import.meta.env.DEV) {
        ph.opt_out_capturing();
        console.log("[PostHog] Opted out in development.");
      }
    },
    capture_pageview: "history_change",
    capture_pageleave: true,
    // Everything below only runs after the visitor accepted analytics in the
    // cookie banner (initPostHog is consent-gated, Global Privacy Control wins).
    autocapture: true, // clicks/submits only; input values are never captured
    capture_dead_clicks: true,
    capture_heatmaps: true,
    capture_exceptions: true,
    capture_performance: true, // web vitals + network timing
    respect_dnt: true,
    session_recording: {
      maskAllInputs: true, // typed comparisons, emails, passwords never leave the browser
      maskTextSelector: "[data-ph-mask]",
    },
  });
  initialized = true;
  posthog.opt_in_capturing();
  if (pendingIdentity) {
    posthog.identify(pendingIdentity.userId, pendingIdentity.traits ?? {});
  }
}

export function disablePostHog() {
  if (!POSTHOG_KEY || !initialized) return;
  posthog.reset();
  posthog.opt_out_capturing();
}

export function captureEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  if (!POSTHOG_KEY || !initialized) return;
  posthog.capture(event, properties ?? {});
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  pendingIdentity = { userId, traits };
  if (!POSTHOG_KEY || !initialized) return;
  posthog.identify(userId, traits ?? {});
}

export function resetPostHog() {
  pendingIdentity = null;
  if (!POSTHOG_KEY || !initialized) return;
  posthog.reset();
}
