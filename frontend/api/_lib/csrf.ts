import crypto from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const CSRF_COOKIE = "sideby_csrf";
const CSRF_HEADER = "x-sideby-csrf";
const ONE_DAY_SECONDS = 24 * 60 * 60;

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isProductionRuntime() {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

function getHeader(request: VercelRequest, name: string): string | null {
  const value = request.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

function getRequestHost(request: VercelRequest): string | null {
  const forwardedHost = getHeader(request, "x-forwarded-host");
  const host = forwardedHost || getHeader(request, "host");
  return host?.toLowerCase() || null;
}

function assertSameOrigin(request: VercelRequest) {
  const origin = getHeader(request, "origin");
  if (!origin) return;

  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    throw Object.assign(new Error("Invalid request origin."), { statusCode: 403 });
  }

  const requestHost = getRequestHost(request);
  if (!requestHost || originHost !== requestHost) {
    throw Object.assign(new Error("Cross-site request blocked."), { statusCode: 403 });
  }
}

function timingSafeEqualString(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function issueCsrfToken(response: VercelResponse) {
  const token = crypto.randomBytes(32).toString("base64url");
  const secure = isProductionRuntime() ? "; Secure" : "";
  response.setHeader(
    "Set-Cookie",
    `${CSRF_COOKIE}=${token}; Path=/; Max-Age=${ONE_DAY_SECONDS}; SameSite=Strict; HttpOnly${secure}`,
  );
  return token;
}

export function assertCsrfForRequest(request: VercelRequest) {
  if (!unsafeMethods.has(request.method || "GET")) return;

  assertSameOrigin(request);

  const hasSessionCookie = Boolean(request.cookies?.__session);
  const authHeader = getHeader(request, "authorization");
  const isBearerOnly = Boolean(authHeader?.startsWith("Bearer ")) && !hasSessionCookie;

  if (isBearerOnly) return;

  const cookieToken = request.cookies?.[CSRF_COOKIE];
  const headerToken = getHeader(request, CSRF_HEADER);

  if (!cookieToken || !headerToken || !timingSafeEqualString(cookieToken, headerToken)) {
    throw Object.assign(new Error("CSRF token missing or invalid."), { statusCode: 403 });
  }
}
