/**
 * Server-side Sentry setup for SideBy Vercel Functions.
 * Only initializes when SENTRY_DSN is present.
 */

import * as Sentry from "@sentry/node";

export function initServerSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return;
  }

  const options = {
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.VERCEL === "1" ? 0.1 : 1.0,
    beforeSend(event) {
      // Scrub sensitive headers and cookies
      if (event.request?.headers) {
        const headers = event.request.headers as Record<string, string>;
        for (const key of Object.keys(headers)) {
          if (/authorization|cookie|x-api-key|secret/i.test(key)) {
            headers[key] = "[REDACTED]";
          }
        }
      }
      return event;
    },
  };

  // Vercel's function compiler narrows Sentry.init to BaseNodeOptions even
  // though the Node SDK accepts the standard DSN-bearing NodeOptions at runtime.
  Sentry.init(options as unknown as Parameters<typeof Sentry.init>[0]);
}

export { Sentry };
