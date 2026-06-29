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

const inFlightRequests = new Map<string, Promise<Response>>();

export const apiFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  retryOptions?: { retries?: number; retryDelay?: number },
): Promise<Response> => {
  const isGet = !init.method || init.method.toUpperCase() === "GET";
  let cacheKey = "";

  // Only collapse requests if there's no custom signal (so we don't accidentally abort concurrent requests)
  // and if it's a simple GET request.
  const canCollapse = isGet && !init.signal;

  if (canCollapse) {
    const urlString = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    // We stringify the headers so different headers don't share the same cache key
    let headersString = "";
    if (init.headers) {
      if (init.headers instanceof Headers) {
        const headersObj: Record<string, string> = {};
        init.headers.forEach((value, key) => {
          headersObj[key] = value;
        });
        headersString = JSON.stringify(headersObj);
      } else {
        headersString = JSON.stringify(init.headers);
      }
    }

    // We intentionally don't include Clerk token in cacheKey directly
    // because all concurrent requests from the same client should share the same token anyway.
    cacheKey = `${urlString}|${headersString}|${init.credentials ?? "default"}`;

    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey)!.then(res => res.clone());
    }
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

  if (canCollapse) {
    inFlightRequests.set(cacheKey, fetchPromise);
    fetchPromise.finally(() => {
      // Only delete if it's the same promise
      if (inFlightRequests.get(cacheKey) === fetchPromise) {
        inFlightRequests.delete(cacheKey);
      }
    });
    // Return a clone for the original caller too, so subsequent `.then(res => res.clone())`
    // won't complain if someone reads the body. Actually, `fetchPromise` returns the original response.
    // If we clone it here, the first caller gets a clone.
    return fetchPromise.then(res => res.clone());
  }

  return fetchPromise;
};
