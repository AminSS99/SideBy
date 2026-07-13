import { describe, it, expect } from "vitest";
import { shouldAlertOnPastDue } from "../../_routes/webhooks/dodo.js";

describe("shouldAlertOnPastDue", () => {
  it("alerts on a genuine transition into past_due from active", () => {
    expect(shouldAlertOnPastDue("active", "past_due")).toBe(true);
  });

  it("alerts on a genuine transition into past_due from null (first event)", () => {
    expect(shouldAlertOnPastDue(null, "past_due")).toBe(true);
  });

  it("alerts on a genuine transition into past_due from trialing", () => {
    expect(shouldAlertOnPastDue("trialing", "past_due")).toBe(true);
  });

  it("does NOT alert when the subscription is already past_due (duplicate/retry)", () => {
    expect(shouldAlertOnPastDue("past_due", "past_due")).toBe(false);
  });

  it("does NOT alert when transitioning out of past_due to active", () => {
    expect(shouldAlertOnPastDue("past_due", "active")).toBe(false);
  });

  it("does NOT alert for non-past_due states", () => {
    expect(shouldAlertOnPastDue("active", "active")).toBe(false);
    expect(shouldAlertOnPastDue(null, "active")).toBe(false);
    expect(shouldAlertOnPastDue("past_due", "canceled")).toBe(false);
  });

  it("does NOT alert for an unknown/empty previous status moving to a healthy state", () => {
    expect(shouldAlertOnPastDue(undefined, "active")).toBe(false);
  });
});
