import type { VercelRequest, VercelResponse } from "@vercel/node";

function getSingleHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getAllowedOrigins(requestHost?: string) {
  const origins = new Set<string>();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VITE_APP_URL;

  if (appUrl) {
    origins.add(appUrl.replace(/\/+$/, ""));
  }

  if (requestHost) {
    origins.add(`https://${requestHost}`);
    if (process.env.NODE_ENV !== "production") {
      origins.add(`http://${requestHost}`);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:5173");
    origins.add("http://127.0.0.1:5173");
  }

  return origins;
}

export function setCorsHeaders(res: VercelResponse, req: VercelRequest) {
  const origin = getSingleHeader(req.headers.origin);
  const requestHost = getSingleHeader(req.headers["x-forwarded-host"]) || getSingleHeader(req.headers.host);
  const allowedOrigins = getAllowedOrigins(requestHost);

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-SideBy-CSRF");
  res.setHeader("Access-Control-Allow-Credentials", "true");
}
