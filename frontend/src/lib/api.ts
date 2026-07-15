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
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

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

const inFlightGets = new Map<string, Promise<Response>>();

export const apiFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  retryOptions?: { retries?: number; retryDelay?: number },
) => {
  const method = (init.method || "GET").toUpperCase();

  if (method === "GET") {
    const cacheKey = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (inFlightGets.has(cacheKey)) {
      return inFlightGets.get(cacheKey)!.then(res => res.clone());
    }

    const promise = executeFetch(input, init, retryOptions).finally(() => {
      inFlightGets.delete(cacheKey);
    });

    inFlightGets.set(cacheKey, promise);
    return promise.then(res => res.clone());
  }

  return executeFetch(input, init, retryOptions);
};

const executeFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  retryOptions?: { retries?: number; retryDelay?: number },
) => {
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

        throw error;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if it's not a retryable error
      if (!isRetryableError(error)) {
        reportApiFailure(lastError, input, method, attempt + 1);
        throw error;
      }

      // Don't sleep on the last attempt
      if (attempt < maxRetries) {
        const delay = baseDelay * 2 ** attempt;
        await sleep(delay);
      }
    }
  }

  if (lastError) {
    reportApiFailure(lastError, input, method, maxRetries + 1);
  }

  throw lastError;
};
