import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/db/index.js", () => ({ createDbClient: vi.fn(() => { throw new Error("db must not be touched for comped users"); }) }));
vi.mock("../snapsolve-core.js", () => ({
  checkSnapSolveEntitlement: vi.fn(async () => null),
  resolveSnapSolveWorkspaceSession: vi.fn(async () => null),
}));

const OWNER = "user_TESTOWNER0000000000000000A1";
const OTHER = "user_TESTOTHER0000000000000000B2";

describe("comped business override", () => {
  const original = process.env.SIDEBY_COMPED_BUSINESS_USER_IDS;
  beforeEach(() => { delete process.env.SIDEBY_COMPED_BUSINESS_USER_IDS; });
  afterEach(() => {
    if (original === undefined) delete process.env.SIDEBY_COMPED_BUSINESS_USER_IDS;
    else process.env.SIDEBY_COMPED_BUSINESS_USER_IDS = original;
  });

  it("grants nobody when the variable is unset or empty", async () => {
    const { isCompedBusinessUser } = await import("../subscription.js");
    expect(isCompedBusinessUser(OWNER)).toBe(false);
    process.env.SIDEBY_COMPED_BUSINESS_USER_IDS = "";
    expect(isCompedBusinessUser(OWNER)).toBe(false);
  });

  it("grants only the exact listed Clerk id", async () => {
    process.env.SIDEBY_COMPED_BUSINESS_USER_IDS = ` ${OWNER} `;
    const { isCompedBusinessUser } = await import("../subscription.js");
    expect(isCompedBusinessUser(OWNER)).toBe(true);
    expect(isCompedBusinessUser(OTHER)).toBe(false);
    expect(isCompedBusinessUser(OWNER.toLowerCase())).toBe(false);
    expect(isCompedBusinessUser(OWNER + "x")).toBe(false);
    expect(isCompedBusinessUser(OWNER.slice(0, -1))).toBe(false);
  });

  it("ignores malformed entries, emails, wildcards and the test-auth user", async () => {
    process.env.SIDEBY_COMPED_BUSINESS_USER_IDS = "maxrowns1@gmail.com,*,user_*,user_test_mock,,user_";
    const { isCompedBusinessUser } = await import("../subscription.js");
    for (const id of ["maxrowns1@gmail.com", "*", "user_test_mock", "user_", "", null, undefined, OWNER]) {
      expect(isCompedBusinessUser(id as string | null | undefined)).toBe(false);
    }
  });

  it("resolves the top tier without touching the database or SnapSolve; everyone else stays free", async () => {
    process.env.SIDEBY_COMPED_BUSINESS_USER_IDS = OWNER;
    const { resolveSubscriptionState } = await import("../subscription.js");
    const owner = await resolveSubscriptionState({ userId: OWNER });
    expect(owner).toMatchObject({ plan: "business", source: "comped_override", isUnlimited: false });
    await expect(resolveSubscriptionState({ userId: OTHER })).rejects.toThrow(); // falls through to the DB (mocked to throw), i.e. no override
    const anon = await resolveSubscriptionState({ userId: null });
    expect(anon.plan).toBe("free");
  });
});
