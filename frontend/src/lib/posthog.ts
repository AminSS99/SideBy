import posthog from "posthog-js";

const POSTHOG_KEY =
  import.meta.env.VITE_POSTHOG_KEY || import.meta.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  import.meta.env.VITE_POSTHOG_HOST ||
  import.meta.env.NEXT_PUBLIC_POSTHOG_HOST ||
  "https://us.i.posthog.com";

export function initPostHog() {
  if (!POSTHOG_KEY) {
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    loaded: (ph) => {
      if (import.meta.env.DEV) {
        ph.opt_out_capturing();
        console.log("[PostHog] Opted out in development.");
      }
    },
    capture_pageview: true,
    autocapture: false, // Manual event tracking for sensitive data safety
  });
}

export function captureEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  if (!POSTHOG_KEY) return;
  posthog.capture(event, properties ?? {});
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (!POSTHOG_KEY) return;
  posthog.identify(userId, traits ?? {});
}

export function resetPostHog() {
  if (!POSTHOG_KEY) return;
  posthog.reset();
}
