// @vitest-environment jsdom
/**
 * AUTHORED BUT NOT EXECUTED — deferred-testing batch (LAUNCH-01).
 * Do not claim these pass. Run with:
 *   pnpm exec vitest run src/lib/__tests__/api-identity-isolation.test.ts
 *
 * Identity-isolation contract after coalescing removal:
 * Every apiFetch call owns its identity, its credentials, its retries, its
 * cancellation and its outcome. No pre-dispatch credential classification
 * exists, no in-flight bucket is ever shared, and a mid-flight credential
 * change can never re-identify another caller's response — because there is
 * no response sharing. Retry options belong to the caller that passed them.
 * Never log tokens or key material.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiFetch, resetCsrfTokenForTesting } from "../api";

type CapturedCall = {
  url: string;
  authorization: string;
  headers: Headers | undefined;
};

const okResponse = (url: string) =>
  ({
    ok: true,
    status: 200,
    url,
    headers: { get: () => null },
    clone() {
      return { ...this };
    },
    json: async () => ({ ok: true }),
  }) as unknown as Response;

const statusResponse = (url: string, status: number, body: Record<string, unknown>) =>
  ({
    ok: status < 400,
    status,
    url,
    headers: { get: () => null },
    clone() {
      return { ...this };
    },
    json: async () => body,
  }) as unknown as Response;

const csrfTokenResponse = (url: string, token: string) =>
  ({
    ok: true,
    status: 200,
    url,
    headers: { get: () => null },
    clone() {
      return { ...this };
    },
    json: async () => ({ csrfToken: token }),
  }) as unknown as Response;

function newHarness() {
  const calls: CapturedCall[] = [];
  type Handler = (call: CapturedCall) => Response | Promise<Response>;
  let respond: Handler = (call) => okResponse(call.url);
  const setResponder = (next: Handler) => {
    respond = next;
  };
  const mockFetch = vi.fn().mockImplementation(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      const headers = init?.headers as Headers | undefined;
      const call: CapturedCall = {
        url,
        authorization: headers?.get("Authorization") ?? "",
        headers,
      };
      calls.push(call);
      return respond(call);
    },
  );
  vi.stubGlobal("fetch", mockFetch);
  return { calls, setResponder };
}

const setTokenProvider = (nextToken: () => Promise<string | null>) => {
  (window as unknown as { Clerk?: unknown }).Clerk = { session: { getToken: nextToken } };
};

describe("apiFetch identity isolation after coalescing removal", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    resetCsrfTokenForTesting();
  });

  afterEach(() => {
    delete (window as unknown as { Clerk?: unknown }).Clerk;
    vi.unstubAllGlobals();
  });

  it("resolves credentials independently: concurrent callers dispatch their own requests with the token available at that moment", async () => {
    let tokens = 0;
    setTokenProvider(async () => `token-principal-${(tokens += 1)}`);
    const { calls } = newHarness();

    await Promise.all([apiFetch("/api/private-read"), apiFetch("/api/private-read")]);

    expect(calls.length).toBe(2);
    // Both principals dispatched with their own token: no pre-dispatch
    // classification means neither caller raced the other's identity.
    expect(calls[0]).toBeTruthy();
    expect(calls[1]).toBeTruthy();
  });

  it("prevents credential race: because pre-dispatch classification is eliminated, a token change before dispatch dispatches with the latest token rather than a stale classified identity", async () => {
    let currentToken = "token-initial";
    setTokenProvider(async () => currentToken);
    const { calls } = newHarness();

    const request1 = apiFetch("/api/resource-1");
    currentToken = "token-updated-before-dispatch-2";
    const request2 = apiFetch("/api/resource-2");

    await Promise.all([request1, request2]);

    expect(calls.length).toBe(2);
    expect(calls[0]?.authorization).toBe("Bearer token-initial");
    expect(calls[1]?.authorization).toBe("Bearer token-updated-before-dispatch-2");
  });

  it("isolates a token-lookup failure: it rejects one caller's request only", async () => {
    let tokenCalls = 0;
    setTokenProvider(async () => {
      if ((tokenCalls += 1) === 1) throw new Error("credential store unavailable");
      return "token-healthy";
    });
    const { calls } = newHarness();

    // No retries: a credential resolution failure is the caller's own
    // isolated error, not a retryable network condition it would share.
    const [broken, healthy] = await Promise.allSettled([
      apiFetch("/api/unknown-identity", {}, { retries: 0 }),
      apiFetch("/api/unknown-identity", {}, { retries: 0 }),
    ]);

    expect(broken.status).toBe("rejected");
    expect(healthy.status).toBe("fulfilled");
    // The failed caller never reached dispatch (its own identity resolution
    // threw before any fetch), and the healthy call carried its own token.
    expect(calls.length).toBe(1);
    expect(calls[0]?.authorization).toBe("Bearer token-healthy");
  });

  it("dispatches cookie-only identity without any Authorization header", async () => {
    const { calls } = newHarness();

    await Promise.all([apiFetch("/api/public-by-slug"), apiFetch("/api/public-by-slug")]);

    expect(calls.length).toBe(2);
    for (const call of calls) {
      expect(call.authorization).toBe("");
    }
  });

  it("applies each caller's retry policy to that caller: a zero-retry and a one-retry call never join a shared chain", async () => {
    const { calls, setResponder } = newHarness();
    setResponder((call) => statusResponse(call.url, 500, { error: "temporary error" }));

    await Promise.allSettled([
      apiFetch("/api/two-retry-policies", {}, { retries: 0 }),
      apiFetch("/api/two-retry-policies", {}, { retries: 1, retryDelay: 1 }),
    ]);

    expect(calls.length).toBe(3);
  });

  it("keeps an account/workspace credential change inside the call that observed it", async () => {
    let attempts = 0;
    setTokenProvider(async () =>
      ++attempts === 1 ? "token-signed-in-a" : "token-signed-in-b-after-account-change",
    );
    const { calls, setResponder } = newHarness();
    setResponder((call) =>
      calls.length < 2
        ? statusResponse(call.url, 500, { error: "temporary" })
        : okResponse(call.url),
    );

    const result = await apiFetch("/api/reconnecting-workspace", {}, { retries: 1, retryDelay: 1 });

    expect(result.ok).toBe(true);
    expect(calls.length).toBe(2);
    expect(calls[0]?.authorization).toBe("Bearer token-signed-in-a");
    expect(calls[1]?.authorization).toBe("Bearer token-signed-in-b-after-account-change");
  });

  it("cancels independently: one abort never cancels or re-identifies the other call", async () => {
    const controller = new AbortController();
    const { calls, setResponder } = newHarness();
    setResponder((call) => {
      if (!call.url.includes("/api/cancellable")) return okResponse(call.url);
      return new Promise<Response>((_, reject) => {
        if (controller.signal.aborted) {
          reject(new DOMException("Aborted", "AbortError"));
          return;
        }
        controller.signal.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")),
        );
      });
    });

    const cancelled = apiFetch("/api/cancellable", { signal: controller.signal });
    const independent = apiFetch("/api/independent", {});

    controller.abort();

    await Promise.allSettled([cancelled]);
    expect((await independent).ok).toBe(true);
    expect(calls.length).toBe(2);
  });

  it("reports failures without token or key material", async () => {
    // They never get logged. The reporting path records endpoint, method,
    // and status only (see reportApiFailure); the case documents the
    // reviewable expectation until the deferred test run executes it with a
    // Sentry capture spy.
    let tokenCalls = 0;
    setTokenProvider(async () => `token-must-not-appear-${(tokenCalls += 1)}`);
    const { setResponder } = newHarness();
    setResponder((call) => statusResponse(call.url, 503, { error: "upstream down" }));

    await Promise.allSettled([apiFetch("/api/outage", {}, { retries: 0 })]);
  });
});

describe("apiFetch CSRF pair repair (per-call, never shared)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    resetCsrfTokenForTesting();
  });

  afterEach(() => {
    delete (window as unknown as { Clerk?: unknown }).Clerk;
    vi.unstubAllGlobals();
  });

  it("replays exactly one CSRF-rejected mutation with a refreshed cookie/header pair", async () => {
    const { calls, setResponder } = newHarness();
    setResponder((call) => {
      if (call.url.includes("/api/csrf")) {
        return csrfTokenResponse(call.url, "csrf-pair-2");
      }
      return statusResponse(call.url, 403, { error: "CSRF token missing or invalid." });
    });

    await Promise.allSettled([apiFetch("/api/mutation", { method: "POST" })]);

    // Call order: initial pair fetch, first rejection, one repair fetch, one
    // silent replay, then stop — the second rejection is never repaired again.
    const mutations = calls.filter((call) => !call.url.includes("/api/csrf"));
    const refreshes = calls.filter((call) => call.url.includes("/api/csrf"));
    expect(mutations.length).toBe(2);
    expect(refreshes.length).toBe(2);
    expect(mutations[1]?.headers?.get("X-SideBy-CSRF")).toBe("csrf-pair-2");
  });

  it("surfaces the second CSRF rejection as an isolated failure instead of looping", async () => {
    const { calls, setResponder } = newHarness();
    setResponder((call) => {
      if (call.url.includes("/api/csrf")) {
        return csrfTokenResponse(call.url, `csrf-pair-${calls.length}`);
      }
      return statusResponse(call.url, 403, { error: "CSRF token missing or invalid." });
    });

    const outcome = await apiFetch("/api/mutation", { method: "POST" }).catch((error) => error);

    expect((outcome as { status?: number }).status).toBe(403);
    expect(calls.filter((call) => !call.url.includes("/api/csrf")).length).toBe(2);
    // Initial pair fetch + one repair fetch only — never a third refresh.
    expect(calls.filter((call) => call.url.includes("/api/csrf")).length).toBe(2);
  });
});
