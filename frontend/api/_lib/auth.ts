/**
 * SideBy auth layer for Vercel API functions.
 * Extracts userId and optional orgId from Clerk session tokens.
 */
import { verifyToken } from "@clerk/backend";
import type { VercelRequest } from "@vercel/node";
import { assertCsrfForRequest } from "./csrf.js";

const clerkSecretKey = () => process.env.CLERK_SECRET_KEY || "";

const isProductionRuntime = () =>
  process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

const isTestAuthEnabled = () => {
  if (isProductionRuntime()) return false;
  return process.env.VITE_ENABLE_TEST_AUTH === "true" || process.env.ENABLE_TEST_AUTH === "true";
};

const isTestAuthUser = (userId: string) => !isProductionRuntime() && userId === "user_test_mock";

export interface AuthContext {
  userId: string | null;
  orgId: string | null;
  orgRole: string | null;
  iat?: number;
}

export const authenticateRequest = async (
  request: VercelRequest,
): Promise<AuthContext> => {
  const secretKey = clerkSecretKey();
  if (!secretKey) return { userId: null, orgId: null, orgRole: null };

  const sessionToken =
    request.cookies?.__session ||
    request.headers.authorization?.replace("Bearer ", "") ||
    "";

  if (!sessionToken) return { userId: null, orgId: null, orgRole: null };

  if (sessionToken === "test-token" && isTestAuthEnabled()) {
    const testIatHeader = request.headers["x-test-iat"];
    const testIat = testIatHeader
      ? Number(Array.isArray(testIatHeader) ? testIatHeader[0] : testIatHeader)
      : Math.floor(Date.now() / 1000);
    return {
      userId: "user_test_mock",
      orgId: null,
      orgRole: null,
      iat: Number.isFinite(testIat) ? testIat : Math.floor(Date.now() / 1000),
    };
  }

  try {
    // Optional allow-list of origins that may mint session tokens (the `azp`
    // claim). Set CLERK_AUTHORIZED_PARTIES=https://sideby.ink,https://www.sideby.ink
    // so tokens minted for another app on the same Clerk instance are rejected.
    const authorizedParties = (process.env.CLERK_AUTHORIZED_PARTIES || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
    const claims = await verifyToken(sessionToken, {
      secretKey,
      ...(authorizedParties.length > 0 ? { authorizedParties } : {}),
    });
    const rawIat = typeof claims.auth_time === "number"
      ? claims.auth_time
      : typeof claims.iat === "number"
        ? claims.iat
        : typeof (claims as Record<string, unknown>).auth_time === "string"
          ? Number((claims as Record<string, unknown>).auth_time)
          : typeof (claims as Record<string, unknown>).iat === "string"
            ? Number((claims as Record<string, unknown>).iat)
            : undefined;
    const iat = rawIat !== undefined && Number.isFinite(rawIat)
      ? (rawIat > 1e11 ? Math.floor(rawIat / 1000) : Math.floor(rawIat))
      : undefined;

    return {
      userId: claims.sub || null,
      orgId: (claims.org_id as string) || null,
      orgRole: (claims.org_role as string) || null,
      ...(iat !== undefined ? { iat } : {}),
    };
  } catch {
    return { userId: null, orgId: null, orgRole: null };
  }
};

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const MUTATION_BURST_PER_MINUTE = Number(process.env.MUTATION_BURST_PER_MINUTE || "60");

export const requireAuth = async (
  request: VercelRequest,
): Promise<{ userId: string; orgId?: string; orgRole?: string; iat?: number }> => {
  assertCsrfForRequest(request);

  const auth = await authenticateRequest(request);
  if (!auth.userId) {
    const error = new Error("Authentication required.");
    (error as Error & { statusCode: number }).statusCode = 401;
    throw error;
  }

  // Backstop for every write route, including ones without their own quota:
  // one account cannot hammer mutations faster than MUTATION_BURST_PER_MINUTE.
  if (MUTATING_METHODS.has(request.method || "GET") && !isTestAuthUser(auth.userId)) {
    let burstAllowed = true;
    try {
      const { checkRateLimit } = await import("./rate-limit.js");
      burstAllowed = (await checkRateLimit("user", auth.userId, "mutation-burst", MUTATION_BURST_PER_MINUTE)).allowed;
    } catch (error) {
      // Fail open: a counter-store outage must not turn every write into a 500.
      console.error("mutation-burst limiter unavailable", error instanceof Error ? error.message : String(error));
    }
    if (!burstAllowed) {
      throw Object.assign(new Error("Too many requests. Please slow down."), { statusCode: 429 });
    }
  }
  return {
    userId: auth.userId,
    orgId: auth.orgId ?? undefined,
    orgRole: auth.orgRole ?? undefined,
    ...(auth.iat !== undefined ? { iat: auth.iat } : {}),
  };
};

export const isAuthEnabled = (): boolean =>
  Boolean(clerkSecretKey()) || isProductionRuntime();
