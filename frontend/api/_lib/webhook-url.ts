import { BlockList, isIP } from "node:net";

const nonPublic = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10],
  ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.168.0.0", 16],
  ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24],
  ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) nonPublic.addSubnet(address, prefix, "ipv4");
for (const [address, prefix] of [
  ["::", 96], ["::1", 128], ["64:ff9b::", 96], ["64:ff9b:1::", 48],
  ["100::", 64], ["2001::", 32], ["2001:db8::", 32], ["2002::", 16],
  ["fc00::", 7], ["fe80::", 10], ["ff00::", 8],
] as const) nonPublic.addSubnet(address, prefix, "ipv6");

export function isNonPublicAddress(address: string) {
  const family = isIP(address);
  return !family || nonPublic.check(address, family === 4 ? "ipv4" : "ipv6");
}

function isProductionRuntime() {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

function isPrivateHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/\.$/, "").replace(/^\[|\]$/g, "");

  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "metadata.google.internal"
  ) {
    return true;
  }

  return isIP(normalized) ? isNonPublicAddress(normalized) : false;
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
