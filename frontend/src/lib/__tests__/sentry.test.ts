import { describe, expect, it } from "vitest";
import { shouldInitializeSentry } from "../sentry";

describe("Sentry initialization policy", () => {
  it("does not initialize without a DSN", () => {
    expect(
      shouldInitializeSentry({
        hasDsn: false,
        isProduction: true,
        developmentOptIn: true,
      }),
    ).toBe(false);
  });

  it("initializes in production when a DSN exists", () => {
    expect(
      shouldInitializeSentry({
        hasDsn: true,
        isProduction: true,
        developmentOptIn: false,
      }),
    ).toBe(true);
  });

  it("keeps development reporting off by default", () => {
    expect(
      shouldInitializeSentry({
        hasDsn: true,
        isProduction: false,
        developmentOptIn: false,
      }),
    ).toBe(false);
  });

  it("allows an explicit development opt-in", () => {
    expect(
      shouldInitializeSentry({
        hasDsn: true,
        isProduction: false,
        developmentOptIn: true,
      }),
    ).toBe(true);
  });
});
