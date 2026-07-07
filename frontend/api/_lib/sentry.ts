/**
 * Server-side Sentry setup for SideBy Vercel Functions.
 * Only initializes when SENTRY_DSN is present.
 */

import * as Sentry from "@sentry/node";

let initialized = false;

export function initServerSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return;
  }
  if (initialized) {
    return;
  }
  initialized = true;

  const options = {
    dsn,
    release:
      process.env.SENTRY_RELEASE ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.VERCEL === "1" ? 0.1 : 1.0,
    beforeSend(event: Sentry.ErrorEvent) {
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

  const init = Sentry.init as (initOptions: unknown) => unknown;
  init(options);
}

export function captureServerException(
  error: unknown,
  context?: Parameters<typeof Sentry.captureException>[1],
) {
  if (!initialized) {
    return;
  }
  Sentry.captureException(error, context);
}

export { Sentry };
