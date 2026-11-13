import { describe, expect, it } from "vitest";
import type { VercelRequest } from "@vercel/node";
import { getClientIp } from "../route-guard.js";

function makeRequest(
  headers: Record<string, string | string[] | undefined>,
  remoteAddress?: string,
): VercelRequest {
  return {
    headers,
    socket: remoteAddress ? { remoteAddress } : {},
  } as unknown as VercelRequest;
}

describe("getClientIp", () => {
  it("prefers x-vercel-forwarded-for over spoofable x-forwarded-for", () => {
    const req = makeRequest({
      "x-vercel-forwarded-for": "198.51.100.10, 10.0.0.1",
      "x-real-ip": "198.51.100.20",
      "x-forwarded-for": "203.0.113.99",
    });
    expect(getClientIp(req)).toBe("198.51.100.10");
  });

  it("prefers x-real-ip and cf-connecting-ip before x-forwarded-for", () => {
    expect(
      getClientIp(
        makeRequest({
          "x-real-ip": "198.51.100.20",
          "x-forwarded-for": "203.0.113.99",
        }),
      ),
    ).toBe("198.51.100.20");

    expect(
      getClientIp(
        makeRequest({
          "cf-connecting-ip": ["198.51.100.30, 10.0.0.2"],
          "x-forwarded-for": "203.0.113.99",
        }),
      ),
    ).toBe("198.51.100.30");
  });

  it("falls back to x-forwarded-for and socket.remoteAddress", () => {
    expect(
      getClientIp(makeRequest({ "x-forwarded-for": "192.0.2.1, 10.0.0.1" })),
    ).toBe("192.0.2.1");

    expect(getClientIp(makeRequest({}, "127.0.0.1"))).toBe("127.0.0.1");
    expect(getClientIp(makeRequest({}))).toBeNull();
  });
});
