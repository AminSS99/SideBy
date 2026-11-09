import { describe, expect, it, vi } from "vitest";

vi.mock("../../_lib/auth.js", () => ({ requireAuth: vi.fn() }));
vi.mock("../../_lib/push.js", () => ({ isPushConfigured: vi.fn(), upsertSubscription: vi.fn(), validateSubscriptionInput: vi.fn() }));
vi.mock("../../../src/db/index.js", () => ({ createDbClient: vi.fn() }));

import { isKnownPushService } from "./subscribe.js";

describe("isKnownPushService", () => {
  it("accepts the real browser push services", () => {
    for (const ok of [
      "https://fcm.googleapis.com/fcm/send/abc",
      "https://updates.push.services.mozilla.com/wpush/v2/abc",
      "https://web.push.apple.com/abc",
      "https://wns2-par02p.notify.windows.com/w/?token=x",
    ]) expect(isKnownPushService(ok)).toBe(true);
  });
  it("rejects internal, look-alike, non-https and port-pinned hosts", () => {
    for (const bad of [
      "https://169.254.169.254/latest",
      "https://localhost/x",
      "https://evilfcm.googleapis.com.attacker.test/x",
      "https://fcm.googleapis.com.evil.test/x",
      "http://fcm.googleapis.com/x",
      "https://fcm.googleapis.com:8443/x",
      "not a url",
    ]) expect(isKnownPushService(bad)).toBe(false);
  });
});
