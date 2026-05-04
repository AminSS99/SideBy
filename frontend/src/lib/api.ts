type ClerkSession = {
  getToken: () => Promise<string | null>;
};

type ClerkGlobal = {
  session?: ClerkSession | null;
};

const getClerkToken = async () => {
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

export const apiFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
) => {
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
          },
        });
      }).catch(() => {
        // Sentry not available, ignore
      });
    }

    throw error;
  }

  return response;
};
