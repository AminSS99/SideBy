import { describe, it, expect, vi } from "vitest";
import {
  buildComparisonCompletedPayload,
  buildComparisonFailedPayload,
  buildTestPayload,
  deliverToSubscription,
  sendPayloadToSubscriptions,
  validateSubscriptionInput,
  type PushDeliveryFn,
  type PushPayload,
  type StoredPushSubscription,
} from "../push.js";

const makeSubscription = (endpoint = "https://fcm.googleapis.com/fcm/send/device-1"): StoredPushSubscription => ({
  id: "sub-1",
  endpoint,
  p256dh: "p256dh-key-material",
  auth: "auth-key-material",
});

describe("push payload builders", () => {
  it("completed payloads deep-link to the comparison and are tagged per comparison", () => {
    const payload = buildComparisonCompletedPayload({
      comparisonId: "abc-123",
      query: "React vs Vue for a SaaS dashboard",
    });

    expect(payload.type).toBe("comparison.completed");
    expect(payload.url).toBe("/app/comparisons/abc-123");
    expect(payload.tag).toBe("comparison:abc-123");
    expect(payload.comparisonId).toBe("abc-123");
    expect(payload.title.length).toBeGreaterThan(0);
    expect(payload.body).toContain("React vs Vue");
  });

  it("failed payloads also deep-link to the comparison for one-click retry", () => {
    const payload = buildComparisonFailedPayload({ comparisonId: "xyz-9", query: "Postgres vs MySQL" });

    expect(payload.type).toBe("comparison.failed");
    expect(payload.url).toBe("/app/comparisons/xyz-9");
    expect(payload.tag).toBe("comparison:xyz-9");
    expect(payload.body.toLowerCase()).toContain("attention");
  });

  it("truncates very long queries instead of producing oversized notifications", () => {
    const payload = buildComparisonCompletedPayload({
      comparisonId: "long",
      query: "x".repeat(400),
    });
    expect(payload.body.length).toBeLessThanOrEqual(160);
  });

  it("test payloads are clearly labeled and never point at comparison pages", () => {
    const payload = buildTestPayload();

    expect(payload.type).toBe("test");
    expect(payload.title.startsWith("[SideBy Test]")).toBe(true);
    expect(payload.url.startsWith("/app/comparisons/")).toBe(false);
  });
});

describe("validateSubscriptionInput", () => {
  it("accepts a standard PushSubscription.toJSON() shape", () => {
    const input = {
      endpoint: "https://fcm.googleapis.com/fcm/send/abc",
      keys: { p256dh: "a-long-p256dh-key", auth: "an-auth-key" },
      expirationTime: null,
    };
    expect(validateSubscriptionInput(input)?.endpoint).toBe(input.endpoint);
  });

  it("rejects payloads without keys or with non-URL endpoints", () => {
    expect(validateSubscriptionInput({ endpoint: "not-a-url", keys: {} })).toBeNull();
    expect(validateSubscriptionInput({ endpoint: "https://ok.example" })).toBeNull();
    expect(validateSubscriptionInput(null)).toBeNull();
    expect(validateSubscriptionInput("string")).toBeNull();
  });
});

describe("sendPayloadToSubscriptions subscription lifecycle", () => {
  const payload: PushPayload = buildTestPayload();

  it("counts successful deliveries", async () => {
    const deliver: PushDeliveryFn = vi.fn().mockResolvedValue({ ok: true, expired: false });
    const summary = await sendPayloadToSubscriptions(
      [makeSubscription("e1"), makeSubscription("e2")],
      payload,
      deliver,
    );
    expect(summary.sent).toBe(2);
    expect(summary.failed).toBe(0);
    expect(summary.expiredEndpoints).toHaveLength(0);
  });

  it("collects expired endpoints (404/410) so callers can prune dead subscriptions", async () => {
    const deliver: PushDeliveryFn = vi
      .fn()
      .mockImplementation(async (subscription) =>
        subscription.endpoint === "e-dead"
          ? { ok: false, expired: true, error: "subscription-410" }
          : { ok: true, expired: false },
      );

    const summary = await sendPayloadToSubscriptions(
      [makeSubscription("e-alive"), makeSubscription("e-dead")],
      payload,
      deliver,
    );

    expect(summary.sent).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.expiredEndpoints).toEqual(["e-dead"]);
  });

  it("keeps non-expired failures subscribed (transient errors are retried later)", async () => {
    const deliver: PushDeliveryFn = vi
      .fn()
      .mockResolvedValue({ ok: false, expired: false, error: "network timeout" });

    const summary = await sendPayloadToSubscriptions([makeSubscription("e-flaky")], payload, deliver);

    expect(summary.failed).toBe(1);
    expect(summary.expiredEndpoints).toHaveLength(0);
  });

  it("survives a delivery function that throws unexpectedly", async () => {
    const deliver: PushDeliveryFn = vi.fn().mockRejectedValue(new Error("boom"));
    const summary = await sendPayloadToSubscriptions([makeSubscription()], payload, deliver);
    expect(summary.sent).toBe(0);
    expect(summary.failed).toBe(1);
    expect(summary.expiredEndpoints).toHaveLength(0);
  });

  it("returns an empty summary for users with zero subscriptions", async () => {
    const deliver: PushDeliveryFn = vi.fn();
    const summary = await sendPayloadToSubscriptions([], payload, deliver);
    expect(deliver).not.toHaveBeenCalled();
    expect(summary).toEqual({ sent: 0, failed: 0, expiredEndpoints: [] });
  });
});

describe("deliverToSubscription", () => {
  it("maps push-service 404/410 responses to expired=true", async () => {
    const { default: webpush } = await import("web-push");
    const vapidKeys = webpush.generateVAPIDKeys();
    process.env.VAPID_PUBLIC_KEY = vapidKeys.publicKey;
    process.env.VAPID_PRIVATE_KEY = vapidKeys.privateKey;
    vi.resetModules();
    const pushModule = await import("../push.js");
    const sendNotification = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error("gone"), { statusCode: 410 }));

    const result = await pushModule.deliverToSubscription(
      makeSubscription(),
      buildTestPayload(),
      sendNotification,
    );

    expect(result.ok).toBe(false);
    expect(result.expired).toBe(true);

    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
  });

  it("marks unconfigured environments as non-delivery without expiring anything", async () => {
    // Without VAPID env vars set in the test runner, delivery cannot proceed;
    // a config problem must never be misreported as an expired subscription.
    const result = await deliverToSubscription(makeSubscription(), buildTestPayload());
    expect(result.ok).toBe(false);
    expect(result.expired).toBe(false);
    expect(result.error).toBe("push-not-configured");
  });
});
