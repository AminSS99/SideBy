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
  const host = process.env.VERCEL_URL || process.env.HOST || "";
  return host === "localhost" || host.startsWith("localhost:");
};

export interface AuthContext {
  userId: string | null;
  orgId: string | null;
  orgRole: string | null;
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
    return { userId: "user_test_mock", orgId: null, orgRole: null };
  }

  try {
    const claims = await verifyToken(sessionToken, { secretKey });
    return {
      userId: claims.sub || null,
      orgId: (claims.org_id as string) || null,
      orgRole: (claims.org_role as string) || null,
    };
  } catch {
    return { userId: null, orgId: null, orgRole: null };
  }
};

export const requireAuth = async (
  request: VercelRequest,
): Promise<{ userId: string; orgId?: string; orgRole?: string }> => {
  assertCsrfForRequest(request);

  const auth = await authenticateRequest(request);
  if (!auth.userId) {
    const error = new Error("Authentication required.");
    (error as Error & { statusCode: number }).statusCode = 401;
    throw error;
  }
  return {
    userId: auth.userId,
    orgId: auth.orgId ?? undefined,
    orgRole: auth.orgRole ?? undefined,
  };
};

export const isAuthEnabled = (): boolean =>
  Boolean(clerkSecretKey()) || isProductionRuntime();
