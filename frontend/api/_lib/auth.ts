import { verifyToken } from "@clerk/backend";
import type { VercelRequest } from "@vercel/node";

const clerkSecretKey = () =>
  process.env.CLERK_SECRET_KEY || "";

const isProductionRuntime = () =>
  process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

export const authenticateRequest = async (request: VercelRequest): Promise<string | null> => {
  const secretKey = clerkSecretKey();
  if (!secretKey) return null;

  const sessionToken =
    request.cookies?.__session ||
    request.headers.authorization?.replace("Bearer ", "") ||
    "";

  if (!sessionToken) return null;

  try {
    const claims = await verifyToken(sessionToken, { secretKey });
    return claims.sub || null;
  } catch {
    return null;
  }
};

export const isAuthEnabled = (): boolean => Boolean(clerkSecretKey()) || isProductionRuntime();
