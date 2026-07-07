/**
 * Frontend Sentry setup for SideBy.
 * Only initializes when SENTRY_DSN is present.
 */

import * as Sentry from "@sentry/react";

declare const __SENTRY_RELEASE__: string;

const dsn = import.meta.env.VITE_SENTRY_DSN || import.meta.env.SENTRY_DSN;
const release =
  import.meta.env.VITE_SENTRY_RELEASE ||
  import.meta.env.NEXT_PUBLIC_SENTRY_RELEASE ||
  __SENTRY_RELEASE__;

let initialized = false;

export function initSentry() {
  if (!dsn) {
    return;
  }
  if (initialized) {
    return;
  }
  initialized = true;

  Sentry.init({
    dsn,
    release,
    environment: import.meta.env.MODE || "development",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // Scrub potentially sensitive query params from URLs
      if (event.request?.url) {
        try {
          const url = new URL(event.request.url);
          url.searchParams.forEach((_, key) => {
            if (/token|key|secret|password|auth/i.test(key)) {
              url.searchParams.set(key, "[REDACTED]");
            }
          });
          event.request.url = url.toString();
        } catch {
          // ignore URL parse failures
        }
      }
      return event;
    },
  });
}

export function captureFrontendException(
  error: unknown,
  context?: Parameters<typeof Sentry.captureException>[1],
) {
  if (!initialized) {
    return;
  }
  Sentry.captureException(error, context);
}

export { Sentry };
