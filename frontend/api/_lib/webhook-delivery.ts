import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";
import { assertSafeWebhookUrl, isNonPublicAddress } from "./webhook-url.js";

/** Resolve once and pin the socket to that address, preserving TLS host checks. */
export async function deliverWebhook(url: string, payload: string, signature: string): Promise<number> {
  assertSafeWebhookUrl(url);
  const target = new URL(url);
  const hostname = target.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isNonPublicAddress(address))) {
    throw new Error("Webhook destination must resolve only to public addresses.");
  }
  const address = addresses[0];
  const send = target.protocol === "https:" ? httpsRequest : httpRequest;
  return new Promise((resolve, reject) => {
    const req = send(target, {
      method: "POST",
      agent: false,
      signal: AbortSignal.timeout(10_000),
      lookup: (_hostname, options, callback) => {
        if (options.all) callback(null, addresses);
        else callback(null, address.address, address.family);
      },
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        "X-SideBy-Signature": signature,
        "User-Agent": "SideBy-Webhook/1.0",
      },
    }, (response) => {
      // Never follow Location or read an unbounded response body.
      resolve(response.statusCode || 502);
      response.destroy();
    });
    req.on("error", reject);
    req.end(payload);
  });
}
