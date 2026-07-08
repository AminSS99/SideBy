const PRIVATE_IPV4_RANGES = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
];

const PRIVATE_IPV6_PREFIXES = ["::1", "fc", "fd", "fe80"];

function isProductionRuntime() {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

function isPrivateHostname(hostname: string) {
  const normalized = hostname.toLowerCase();

  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "metadata.google.internal"
  ) {
    return true;
  }

  if (PRIVATE_IPV4_RANGES.some((range) => range.test(normalized))) {
    return true;
  }

  const ipv6 = normalized.replace(/^\[/, "").replace(/\]$/, "");
  return PRIVATE_IPV6_PREFIXES.some((prefix) => ipv6.startsWith(prefix));
}

export function assertSafeWebhookUrl(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw Object.assign(new Error("Webhook URL is invalid."), { statusCode: 400 });
  }

  const allowedProtocols = isProductionRuntime() ? new Set(["https:"]) : new Set(["https:", "http:"]);
  if (!allowedProtocols.has(parsed.protocol)) {
    throw Object.assign(new Error("Webhook URL must use HTTPS."), { statusCode: 400 });
  }

  if (parsed.username || parsed.password) {
    throw Object.assign(new Error("Webhook URL must not include credentials."), { statusCode: 400 });
  }

  if (isPrivateHostname(parsed.hostname)) {
    throw Object.assign(new Error("Webhook URL must not target private or local hosts."), { statusCode: 400 });
  }
}
