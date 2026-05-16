type ClerkSession = {
  getToken: () => Promise<string | null>;
};

type ClerkGlobal = {
  session?: ClerkSession | null;
};

export const getClerkToken = async () => {
  if (typeof window === "undefined") {
    return null;
  }

  const clerk = (window as unknown as { Clerk?: ClerkGlobal }).Clerk;
  return (await clerk?.session?.getToken()) ?? null;
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
  // Network errors are retryable
  return true;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiFetch = async (
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
};
