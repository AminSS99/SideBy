// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { cleanup, render, screen, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

/**
 * Regression coverage for the signed-in render loop that crashed mobile
 * Safari ("A problem repeatedly occurred") after sign-in landed on
 * /app/comparisons.
 *
 * Cause: the cache-sync effect called setCachedUser(user) unconditionally
 * while `user` was memoized from `cachedUser`, so every render produced a
 * fresh user object, re-fired the effect, and re-rendered forever. Each
 * iteration also re-identified the user to PostHog, rewrote localStorage,
 * and (via the fresh `session` object) re-fired project/workspace fetches.
 *
 * The fix keeps the Clerk-derived user independent of cache writes, only
 * updates the cache state when field values actually change, and keys
 * session identity by user id — so a signed-in mount settles after a
 * bounded number of renders with a stable session.
 */

const { stableClerkUser, identifyUser, resetPostHog } = vi.hoisted(() => ({
  stableClerkUser: {
    id: "user_stable_123",
    primaryEmailAddress: { emailAddress: "stable@example.com" },
    fullName: "Stable User",
    imageUrl: "https://example.com/avatar.png",
  },
  identifyUser: vi.fn(),
  resetPostHog: vi.fn(),
}));

vi.mock("@clerk/clerk-react", () => ({
  useUser: () => ({ isLoaded: true, isSignedIn: true, user: stableClerkUser }),
  useClerk: () => ({ signOut: vi.fn() }),
}));

vi.mock("@/config/env", () => ({
  envConfig: {
    hasClerkConfig: true,
    canUseTestAuth: false,
    clerkPublishableKey: "pk_test_c3RhYmxlLmNsZXJrLmFjY291bnRzLmRldiQ",
  },
  buildApiUrl: (path: string) => path,
}));

vi.mock("@/lib/posthog", () => ({
  identifyUser,
  resetPostHog,
}));

vi.mock("@/hooks/usePushSubscription", () => ({
  unsubscribeCurrentDevice: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/pwa/register", () => ({
  pwaUpdates: { clearAuthenticatedDrafts: vi.fn() },
}));

// Import after mocks so the provider under test picks them up.
import { AuthProvider, useAuth } from "../AuthContext";

const RENDER_LOOP_LIMIT = 50;

let consumerRenders = 0;
let observedSessions: Array<{ userId: string } | null> = [];

function AuthConsumer(): React.JSX.Element {
  const { session, user, isLoading } = useAuth();
  consumerRenders += 1;
  if (consumerRenders > RENDER_LOOP_LIMIT) {
    // Break an unbounded loop fast instead of hanging the runner: reaching
    // this line is itself the failure signal.
    throw new Error(
      `render loop detected: AuthConsumer rendered ${consumerRenders} times without settling`,
    );
  }
  React.useEffect(() => {
    observedSessions.push(session);
  });
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="user-id">{user?.id ?? "none"}</span>
    </div>
  );
}

function Harness(): React.JSX.Element {
  const [queryClient] = React.useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("AuthContext signed-in render stability", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consumerRenders = 0;
    observedSessions = [];
    identifyUser.mockClear();
    resetPostHog.mockClear();
    localStorage.clear();
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    consoleSpy.mockRestore();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("settles after a bounded number of renders when signed in", async () => {
    render(<Harness />);

    // Flush pending effects, cache sync, and PostHog identification.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(screen.getByTestId("user-id").textContent).toBe("user_stable_123");
    expect(screen.getByTestId("loading").textContent).toBe("false");
    expect(consumerRenders).toBeLessThanOrEqual(6);
  });

  it("keeps the session object identity stable while signed in", async () => {
    render(<Harness />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const nonNull = observedSessions.filter((s) => s !== null);
    expect(nonNull.length).toBeGreaterThan(0);
    const first = nonNull[0];
    for (const session of nonNull) {
      // A fresh session object every render re-fires every downstream
      // effect that depends on it (projects, workspaces) — an API storm.
      expect(session).toBe(first);
    }
  });

  it("identifies the user exactly once instead of once per render", async () => {
    render(<Harness />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(identifyUser).toHaveBeenCalledTimes(1);
    expect(identifyUser).toHaveBeenCalledWith(
      "user_stable_123",
      expect.objectContaining({ email: "stable@example.com" }),
    );
  });

  it("persists the signed-in user to the auth cache", async () => {
    render(<Harness />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const raw = localStorage.getItem("sideby.auth.cache");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? "{}").userId).toBe("user_stable_123");
  });
});
