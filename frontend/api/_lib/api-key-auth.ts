import crypto from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import type { VercelRequest } from "@vercel/node";
import { createDbClient } from "../../src/db/index.js";
import { apiKeys } from "../../src/db/schema.js";

const API_KEY_PREFIX = "sb_live";

function keyPepper() {
  return process.env.API_KEY_PEPPER || process.env.CLERK_SECRET_KEY || "sideby-dev-api-key-pepper";
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

export async function requireApiKey(request: VercelRequest) {
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
