/**
 * Frontend Sentry setup for SideBy.
 * Only initializes when SENTRY_DSN is present.
 */

import * as Sentry from "@sentry/react";

const dsn = import.meta.env.VITE_SENTRY_DSN || import.meta.env.SENTRY_DSN;

export function initSentry() {
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
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

export { Sentry };
