import { envConfig } from "@/config/env";

type ClerkSession = {
  getToken: () => Promise<string | null>;
};

type ClerkGlobal = {
  session?: ClerkSession | null;
};

let csrfTokenPromise: Promise<string | null> | null = null;

export const getClerkToken = async () => {
  if (typeof window === "undefined") {
    return null;
  }

  const isTestAuth =
    envConfig.canUseTestAuth && localStorage.getItem("sideby.test.auth") === "true";
  if (isTestAuth) {
    return "test-token";
  }

  const clerk = (window as unknown as { Clerk?: ClerkGlobal }).Clerk;
  return (await clerk?.session?.getToken()) ?? null;
};

const isUnsafeMethod = (method?: string) => {
  const normalized = (method || "GET").toUpperCase();
  return normalized === "POST" || normalized === "PUT" || normalized === "PATCH" || normalized === "DELETE";
};

const isCsrfEndpoint = (input: RequestInfo | URL) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  return url.includes("/api/csrf");
};

const getCsrfToken = async (authorizationToken: string | null) => {
  if (typeof window === "undefined") return null;
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch("/api/csrf", {
      method: "GET",
      credentials: "include",
      headers: authorizationToken
        ? { Authorization: `Bearer ${authorizationToken}` }
        : undefined,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const data = (await response.json()) as { csrfToken?: string };
        return data.csrfToken || null;
      })
      .catch(() => null);
  }
  return csrfTokenPromise;
};

export const resetCsrfTokenForTesting = () => {
  csrfTokenPromise = null;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  /** Server-requested wait before retrying (from Retry-After), when given. */
  retryAfterMs?: number;

  constructor(message: string, status: number, code?: string, retryAfterMs?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.retryAfterMs = retryAfterMs;
  }
}

/** Parse a Retry-After header (delay-seconds or HTTP date) into ms. */
export const parseRetryAfterMs = (header: string | null): number | undefined => {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1000);
  const date = Date.parse(header);
  if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  return undefined;
};

/**
 * One user-facing vocabulary for request failures. Server messages remain
 * the source of truth when present and safe; this maps the failure classes
 * product UI must distinguish (offline, timeout, signed-out, forbidden,
 * rate-limited, provider down) without leaking provider internals.
 */
export const describeApiFailure = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Your session has expired. Sign in again to continue.";
    if (error.status === 403) return "You don't have access to this in the current workspace.";
    if (error.status === 404) return "That record no longer exists or isn't shared with you.";
    if (error.status === 408) return "The request timed out. Check your connection and try again.";
    if (error.status === 429) {
      return error.retryAfterMs && error.retryAfterMs > 0
        ? `You've hit the usage limit. Try again in about ${Math.max(1, Math.ceil(error.retryAfterMs / 1000))} seconds.`
        : "You've hit the usage limit. Wait a moment and try again.";
    }
    if (error.status >= 500) return "SideBy's service hit a problem. Your work is saved — try again shortly.";
    return error.message;
  }
  if (error instanceof Error && error.name === "AbortError") {
    return "The request timed out. Check your connection and try again.";
  }
  if (error instanceof TypeError) {
    return "You're offline or the connection dropped. Reconnect and try again — nothing was submitted twice.";
  }
  return "Something went wrong. Please try again.";
};

export const shouldReportApiError = (error: unknown): boolean => {
  if (error instanceof ApiError) {
    // Authentication, validation, missing resources, and rate limits are
    // expected product states. Sentry should focus on failures we own.
    return error.status >= 500 || error.status === 408;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return false;
  }

  return true;
};

const getRequestUrl = (input: RequestInfo | URL) =>
  typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

const getSafeEndpoint = (input: RequestInfo | URL) => {
  const rawUrl = getRequestUrl(input);

  try {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://sideby.invalid";
    return new URL(rawUrl, baseUrl).pathname;
  } catch {
    return "unknown";
  }
};

const reportApiFailure = (
  error: Error,
  input: RequestInfo | URL,
  method: string,
  attempt: number,
) => {
  if (typeof window === "undefined" || !shouldReportApiError(error)) return;

  const endpoint = getSafeEndpoint(input);
  const status = error instanceof ApiError ? error.status : "network";

  void import("@sentry/react")
    .then((Sentry) => {
      Sentry.captureException(error, {
        tags: {
          api_endpoint: endpoint,
          api_method: method,
          api_status: String(status),
        },
        extra: {
          endpoint,
          method,
          status,
          code: error instanceof ApiError ? error.code : undefined,
          attempts: attempt,
        },
        fingerprint: ["api-request-failure", method, endpoint, String(status)],
      });
    })
    .catch(() => {
      // Observability must never interrupt the product flow.
    });
};

/**
 * Mutations are never retried automatically: replays can duplicate
 * non-idempotent actions. Only safe read methods get bounded retries, and
 * every request — read or write — owns its own identity and its own outcome.
 */
const isSafeMethod = (method: string) =>
  method === "GET" || method === "HEAD" || method === "OPTIONS";

const isAbortError = (error: unknown) =>
  (error instanceof Error && error.name === "AbortError") ||
  (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError");

const isRetryableError = (error: unknown, method: string): boolean => {
  if (isAbortError(error)) return false;
  if (!isSafeMethod(method)) return false;
  if (error instanceof ApiError) {
    // Retry on 5xx server errors, 408 (timeout), 429 (rate limit with retry-after honored separately)
    // Don't retry 4xx client errors (except 408/429)
    return error.status >= 500 || error.status === 408 || error.status === 429;
  }
  // Don't retry CORS/DNS errors — they are persistent.
  // In most browsers these surface as TypeError: "Failed to fetch".
  if (error instanceof TypeError) {
    return !error.message.includes("Failed to fetch");
  }
  // Retry other network errors (timeouts, connection resets, etc.)
  return true;
};

/** Backoff that stops waiting the moment the request is aborted. */
const sleepOrAbort = (ms: number, signal?: AbortSignal | null) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });

/**
 * The longest the UI will ever wait on a server-requested delay. A longer
 * Retry-After is not silently shortened: the request fails instead with the
 * server's own timing in the error, so the user knows exactly when to retry.
 */
export const MAX_HONORED_RETRY_AFTER_MS = 30_000;

/**
 * In-flight GET collapsing was removed for the release candidate.
 *
 * The previous gate classified a call as "anonymous" from one token
 * snapshot, then `executeFetch` resolved credentials again per attempt and
 * sent cookies by default — so a request admitted into the shared anonymous
 * bucket could dispatch authenticated, and late joiners could receive a
 * response that was never proven to match their own principal (the
 * cookie-only session makes the "necessarily anonymous" residual false).
 *
 * Ownership now works exactly as `ReactQueryProvider` intends: identical
 * reads deduplicate at the cache layer with correctly scoped query keys,
 * mutations carry their own synchronous duplicate guards, and the server
 * keeps its in-flight duplicate-intent lock. Nothing is resolved or stored
 * on behalf of another caller, and no tokens or key material are logged.
 */
export const apiFetch = (
  input: RequestInfo | URL,
  init: RequestInit = {},
  retryOptions?: { retries?: number; retryDelay?: number },
) => {
  return executeFetch(input, init, retryOptions);
};

/** Method comes from init first, then the Request itself; never guessed. */
const resolveMethod = (input: RequestInfo | URL, init: RequestInit): string =>
  ((init.method ?? (input instanceof Request ? input.method : "GET")) as string).toUpperCase();

const executeFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  retryOptions?: { retries?: number; retryDelay?: number },
) => {
  const maxRetries = retryOptions?.retries ?? 2;
  const baseDelay = retryOptions?.retryDelay ?? 1000;
  const method = resolveMethod(input, init);
  let csrfRepaired = false;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const token = await getClerkToken();
      // A Request carries its own headers; init headers override, never erase.
      const headers = new Headers(input instanceof Request ? input.headers : undefined);
      if (init.headers) {
        const overrides = new Headers(init.headers);
        overrides.forEach((value, key) => headers.set(key, value));
      }

      if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      if (isUnsafeMethod(method) && !isCsrfEndpoint(input) && !headers.has("X-SideBy-CSRF")) {
        const csrfToken = await getCsrfToken(token);
        if (csrfToken) {
          headers.set("X-SideBy-CSRF", csrfToken);
        }
      }

      const response = await fetch(input, {
        ...init,
        headers,
        credentials: init.credentials ?? "include",
      });

      if (!response.ok) {
        let message = `Request failed: ${response.status}`;
        let code: string | undefined;

        try {
          const data = (await response.json()) as { error?: string; code?: string };
          if (data.error) message = data.error;
          if (data.code) code = data.code;
        } catch {
          // Ignore parse errors
        }

        const error = new ApiError(
          message,
          response.status,
          code,
          parseRetryAfterMs(response.headers.get("Retry-After")),
        );

        throw error;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Aborts end the request immediately — never retried, never reported.
      if (isAbortError(error) || init.signal?.aborted) {
        throw error;
      }

      // One quiet CSRF repair for mutations: the cookie-and-header pair is
      // issued together with a one-day lifetime, so a long-lived tab can hold
      // a token whose cookie expired or rotated. A 403 from the CSRF gate
      // happens before any route logic runs — nothing was executed — so
      // replaying this one mutation with a refreshed pair is safe and never
      // duplicates. This is per-call state: two callers never share the
      // repair, and the pair fetch itself is never logged.
      if (
        error instanceof ApiError &&
        error.status === 403 &&
        /CSRF token missing or invalid/i.test(error.message)
      ) {
        if (csrfRepaired) {
          reportApiFailure(lastError, input, method, attempt + 1);
          throw error;
        }
        csrfRepaired = true;
        csrfTokenPromise = null;
        try {
          await getCsrfToken(await getClerkToken());
        } catch {
          // The replay below either succeeds or surfaces the pair failure.
        }
        continue;
      }

      // Don't retry if it's not a retryable error. Mutations always surface
      // to an explicit user retry instead of replaying behind the scenes.
      if (!isRetryableError(error, method)) {
        reportApiFailure(lastError, input, method, attempt + 1);
        throw error;
      }

      // Don't sleep on the last attempt. When the server asks for a specific
      // wait, honor it exactly up to MAX_HONORED_RETRY_AFTER_MS. A longer
      // requested wait is not shortened: fail with the server's own timing so
      // the user knows when retrying is allowed.
      if (attempt < maxRetries) {
        const serverDelay =
          error instanceof ApiError ? error.retryAfterMs : undefined;
        if (serverDelay !== undefined && serverDelay > MAX_HONORED_RETRY_AFTER_MS) {
          reportApiFailure(lastError, input, method, attempt + 1);
          throw error;
        }
        const delay =
          serverDelay !== undefined
            ? Math.max(serverDelay, 250)
            : baseDelay * 2 ** attempt;
        try {
          await sleepOrAbort(delay, init.signal ?? null);
        } catch {
          throw error;
        }
      }
    }
  }

  if (lastError) {
    reportApiFailure(lastError, input, method, maxRetries + 1);
  }

  throw lastError;
};
