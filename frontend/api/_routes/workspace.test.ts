import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAuth = vi.fn();
const mockInsertValues = vi.fn();
const mockInsert = vi.fn();
const mockUpdateSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockUpdate = vi.fn();
const mockSelectLimit = vi.fn();
const mockSelectWhere = vi.fn();
const mockSelectFrom = vi.fn();
const mockSelect = vi.fn();

vi.mock("../_lib/auth.js", () => ({ requireAuth }));
vi.mock("../_lib/db-auth.js", () => ({
  canAccessWorkspace: vi.fn(async () => true),
  getAccessibleWorkspaces: vi.fn(async () => []),
}));
vi.mock("../_lib/snapsolve-core.js", () => ({
  createOrLinkSnapSolveWorkspace: vi.fn(async () => null),
}));
vi.mock("../../src/db/index.js", () => ({
  createDbClient: () => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  }),
}));

const makeResponse = () => {
  const headers: Record<string, string> = {};
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    headers,
    setHeader: (k: string, v: string) => { headers[k] = v; },
    hasHeader: (k: string) => k in headers,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
  };
  return res;
};

const call = async (
  body: unknown,
  method = "POST",
  query: Record<string, string> = { resource: "workspaces" },
) => {
  const { default: handler } = await import("./workspace.js");
  const res = makeResponse();
  await handler({ method, body, query, headers: {} } as never, res as never);
  return res;
};

describe("Workspace IDOR protections (/api/workspaces)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireAuth.mockResolvedValue({ userId: "attacker_user_id", orgId: null });

    mockSelectLimit.mockResolvedValue([]);
    mockSelectWhere.mockReturnValue({
      limit: mockSelectLimit,
      orderBy: vi.fn().mockResolvedValue([]),
    });
    mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
    mockSelect.mockReturnValue({ from: mockSelectFrom });

    mockInsertValues.mockImplementation((values: Record<string, unknown>) => ({
      returning: vi.fn().mockResolvedValue([{ id: "ws_new_1", ...values }]),
    }));
    mockInsert.mockReturnValue({ values: mockInsertValues });

    mockUpdateWhere.mockImplementation(() => ({
      returning: vi.fn().mockResolvedValue([{ id: "ws_updated_1" }]),
    }));
    mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
    mockUpdate.mockReturnValue({ set: mockUpdateSet });
  });

  describe("POST /api/workspaces (creation)", () => {
    it("forces ownerId to authenticated userId for user workspaces, ignoring attacker-supplied ownerId", async () => {
      const res = await call({
        name: "Malicious Workspace",
        ownerType: "user",
        ownerId: "victim_user_id",
      });

      expect(res.statusCode).toBe(201);
      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: "attacker_user_id", // forced to caller, NOT victim_user_id
          ownerType: "user",
        }),
      );
    });

    it("rejects org workspace creation when user is not a member of the target organization", async () => {
      // Return empty membership query
      mockSelectLimit.mockResolvedValue([]);

      const res = await call({
        name: "Victim Org Workspace",
        ownerType: "org",
        ownerId: "victim_org_id",
      });

      expect(res.statusCode).toBe(403);
      expect(mockInsertValues).not.toHaveBeenCalled();
      expect((res.body as { error: string }).error).toMatch(/not authorized to create workspace for this organization/i);
    });

    it("allows org workspace creation when user belongs to the target organization", async () => {
      // Mock membership exists
      mockSelectLimit.mockResolvedValue([{ id: "membership_1" }]);

      const res = await call({
        name: "Valid Org Workspace",
        ownerType: "org",
        ownerId: "my_org_id",
      });

      expect(res.statusCode).toBe(201);
      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: "my_org_id",
          ownerType: "org",
        }),
      );
    });
  });

  describe("PATCH /api/workspaces (updates)", () => {
    it("rejects updating a personal workspace owned by another user", async () => {
      // Existing workspace is owned by victim_user_id
      mockSelectLimit.mockResolvedValue([
        { id: "ws_target", ownerId: "victim_user_id", ownerType: "user" },
      ]);

      const res = await call(
        { workspaceId: "ws_target", name: "Renamed by attacker" },
        "PATCH",
      );

      expect(res.statusCode).toBe(403);
      expect(mockUpdate).not.toHaveBeenCalled();
      expect((res.body as { error: string }).error).toMatch(/not authorized to update this workspace/i);
    });

    it("rejects updating an org workspace when caller is only a regular member/viewer", async () => {
      // Workspace owned by org_123
      mockSelectLimit
        .mockResolvedValueOnce([{ id: "ws_target", ownerId: "org_123", ownerType: "org" }])
        .mockResolvedValueOnce([{ role: "viewer" }]); // membership role is viewer

      const res = await call(
        { workspaceId: "ws_target", name: "Renamed by viewer" },
        "PATCH",
      );

      expect(res.statusCode).toBe(403);
      expect(mockUpdate).not.toHaveBeenCalled();
      expect((res.body as { error: string }).error).toMatch(/only organization admins/i);
    });

    it("ignores an admin token role from a different org (cross-org PATCH)", async () => {
      requireAuth.mockResolvedValue({ userId: "attacker_user_id", orgId: "org_attacker", orgRole: "org:admin" });
      mockSelectLimit
        .mockResolvedValueOnce([{ id: "ws_target", ownerId: "org_victim", ownerType: "org" }])
        .mockResolvedValueOnce([]); // attacker has no membership in org_victim

      const res = await call({ workspaceId: "ws_target", name: "Hijacked" }, "PATCH");

      expect(res.statusCode).toBe(403);
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("allows updating an org workspace when caller is an org admin", async () => {
      // Workspace owned by org_123, caller is admin
      mockSelectLimit
        .mockResolvedValueOnce([{ id: "ws_target", ownerId: "org_123", ownerType: "org" }])
        .mockResolvedValueOnce([{ role: "admin" }]);

      const res = await call(
        { workspaceId: "ws_target", name: "New Name" },
        "PATCH",
      );

      expect(res.statusCode).toBe(200);
      expect(mockUpdate).toHaveBeenCalled();
    });
  });
});
