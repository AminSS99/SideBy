/**
 * Frontend Sentry setup for SideBy.
 * Only initializes when SENTRY_DSN is present.
 */

import * as Sentry from "@sentry/react";

const dsn = import.meta.env.VITE_SENTRY_DSN || import.meta.env.SENTRY_DSN;
const enableInDevelopment =
  import.meta.env.VITE_SENTRY_ENABLE_IN_DEVELOPMENT === "true";

export const shouldInitializeSentry = ({
  hasDsn,
  isProduction,
  developmentOptIn,
}: {
  hasDsn: boolean;
  isProduction: boolean;
  developmentOptIn: boolean;
}) => hasDsn && (isProduction || developmentOptIn);

const isLocalEvent = (event: Sentry.Event) => {
  const urls = [
    event.request?.url,
    ...(
      event.exception?.values?.flatMap((value) =>
        value.stacktrace?.frames?.map((frame) => frame.filename) ?? [],
      ) ?? []
    ),
  ].filter((value): value is string => Boolean(value));

  return urls.some((url) => {
    try {
      const hostname = new URL(url, "https://sideby.invalid").hostname;
      return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
    } catch {
      return false;
    }
  });
};

export function initSentry() {
  if (
    !shouldInitializeSentry({
      hasDsn: Boolean(dsn),
      isProduction: import.meta.env.PROD,
      developmentOptIn: enableInDevelopment,
    })
  ) {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || "development",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: [
      /ResizeObserver loop limit exceeded/i,
      /ResizeObserver loop completed with undelivered notifications/i,
    ],
    denyUrls: [/^chrome-extension:/i, /^moz-extension:/i, /^safari-extension:/i],
    beforeSend(event) {
      // Never mix localhost/dev activity into production issue feeds, even if
      // someone accidentally builds locally with production-mode variables.
      if (isLocalEvent(event)) return null;

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
