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

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const isRetryableError = (error: unknown): boolean => {
  if (error instanceof ApiError) {
    // Retry on 5xx server errors, 408 (timeout), 429 (rate limit with retry-after handled separately)
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const inFlightGetRequests = new Map<string, Promise<Response>>();

export const apiFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  retryOptions?: { retries?: number; retryDelay?: number },
): Promise<Response> => {
  const method = (init.method || "GET").toUpperCase();
  const isGet = method === "GET";

  // Cache key is just the URL, since headers/tokens are uniform per session
  // and GET shouldn't have a body.
  const cacheKey = isGet
    ? typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url
    : null;

  if (isGet && cacheKey && inFlightGetRequests.has(cacheKey)) {
    const response = await inFlightGetRequests.get(cacheKey)!;
    return response.clone();
  }

  const fetchPromise = (async () => {
    const maxRetries = retryOptions?.retries ?? 2;
    const baseDelay = retryOptions?.retryDelay ?? 1000;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const token = await getClerkToken();
        const headers = new Headers(init.headers);

        if (token && !headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${token}`);
        }

        if (isUnsafeMethod(init.method) && !isCsrfEndpoint(input) && !headers.has("X-SideBy-CSRF")) {
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

          const error = new ApiError(message, response.status, code);

          // Track API errors in Sentry if available
          if (typeof window !== "undefined" && "__SENTRY__" in window) {
            import("@sentry/react").then((Sentry) => {
              Sentry.captureException(error, {
                extra: {
                  url: typeof input === "string" ? input : input.toString(),
                  method: init.method || "GET",
                  status: response.status,
                  attempt: attempt + 1,
                },
              });
            }).catch(() => {
              // Sentry not available, ignore
            });
          }

          throw error;
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry if it's not a retryable error
        if (!isRetryableError(error)) {
          throw error;
        }

        // Don't sleep on the last attempt
        if (attempt < maxRetries) {
          const delay = baseDelay * 2 ** attempt;
          await sleep(delay);
        }
      }
    }

    throw lastError;
  })();

  if (isGet && cacheKey) {
    inFlightGetRequests.set(cacheKey, fetchPromise);
    try {
      const response = await fetchPromise;
      return response.clone();
    } finally {
      // Remove from map to avoid stale cache, only collapse strictly concurrent requests
      inFlightGetRequests.delete(cacheKey);
    }
  }

  return fetchPromise;
};
