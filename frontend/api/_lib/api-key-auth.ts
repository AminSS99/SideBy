import crypto from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createDbClient } from "../../src/db/index.js";
import { apiKeys } from "../../src/db/schema.js";
import { getClientIp } from "./route-guard.js";
import { checkRateLimit } from "./rate-limit.js";

const API_KEY_PREFIX = "sb_live";
const FAILED_API_KEY_BURST_PER_MINUTE = 30;

function keyPepper() {
  const pepper = process.env.API_KEY_PEPPER || process.env.CLERK_SECRET_KEY;
  if (!pepper) {
    throw Object.assign(
      new Error("API_KEY_PEPPER or CLERK_SECRET_KEY environment variable is required."),
      { statusCode: 503 },
    );
  }
  return pepper;
}

export function hashApiKey(secret: string) {
  return crypto.createHmac("sha256", keyPepper()).update(secret).digest("hex");
}

export function createApiKeySecret() {
  const publicPart = crypto.randomBytes(6).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  const secretPart = crypto.randomBytes(32).toString("base64url");
  const key = `${API_KEY_PREFIX}_${publicPart}_${secretPart}`;
  return {
    key,
    prefix: `${API_KEY_PREFIX}_${publicPart}`,
    hash: hashApiKey(key),
  };
}

export function getApiKeyFromRequest(request: VercelRequest) {
  const header = request.headers.authorization;
  const authValue = Array.isArray(header) ? header[0] : header;
  const bearer = authValue?.startsWith("Bearer ") ? authValue.slice("Bearer ".length) : null;
  const direct = request.headers["x-sideby-api-key"];
  const directValue = Array.isArray(direct) ? direct[0] : direct;
  return bearer || directValue || null;
}

export async function requireApiKey(request: VercelRequest, response?: VercelResponse) {
  const key = getApiKeyFromRequest(request);
  if (!key) {
    throw Object.assign(new Error("API key required."), { statusCode: 401 });
  }

  const db = createDbClient();
  const [row] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, hashApiKey(key)), isNull(apiKeys.revokedAt)))
    .limit(1);

  if (!row) {
    const ip = getClientIp(request) || "unknown";
    const limit = await checkRateLimit("ip", ip, "failed-api-key", FAILED_API_KEY_BURST_PER_MINUTE);
    if (!limit.allowed) {
      const retryAfter = Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000));
      const res = response || (request as { res?: VercelResponse }).res;
      if (res && typeof res.setHeader === "function") {
        res.setHeader("Retry-After", String(retryAfter));
      }
      throw Object.assign(
        new Error("Too many invalid API key attempts. Please slow down."),
        {
          statusCode: 429,
          retryAfter,
          code: "RATE_LIMITED",
        },
      );
    }
    throw Object.assign(new Error("Invalid API key."), { statusCode: 401 });
  }

  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date(), updatedAt: new Date() })
    .where(eq(apiKeys.id, row.id));

  return {
    apiKeyId: row.id,
    userId: row.userId,
    orgId: row.organizationId,
    workspaceId: row.workspaceId,
    scopes: row.scopes as string[],
  };
}

export function assertApiKeyScope(
  apiKey: { scopes: string[] },
  requiredScope: string,
) {
  if (!apiKey.scopes.includes(requiredScope)) {
    throw Object.assign(new Error(`API key is missing required scope: ${requiredScope}.`), {
      statusCode: 403,
    });
  }
}
