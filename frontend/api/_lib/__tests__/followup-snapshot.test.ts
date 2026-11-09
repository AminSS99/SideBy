import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ result: {} as unknown, generated: vi.fn() }));
vi.mock("../db-auth.js", () => ({ canAccessComparison: async () => true }));
vi.mock("../log.js", () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));
vi.mock("../providers/index.js", () => ({ getPrimaryProvider: () => ({ generateObject: state.generated }) }));
vi.mock("../embeddings.js", () => ({ embedText: async () => { throw new Error("No vectors in saved snapshot"); }, toVectorLiteral: () => "[]" }));
vi.mock("../../../src/db/index.js", () => ({ createDbClient: () => ({
  select: () => ({ from: () => ({ where: () => Object.assign(Promise.resolve([]), { limit: async () => [{ status: "completed", result: state.result }] }) }) }),
  insert: () => ({ values: async () => {} }),
}) }));
import { answerFollowUp } from "../followup-engine.js";

beforeEach(() => {
  state.generated.mockReset();
  state.generated.mockResolvedValue({ data: { answer: "Supabase uses PostgreSQL [1].", citations: ["1"], confidence: 0.9, type: "grounded" } });
  state.result = { entities: { a: { name: "Supabase" }, b: { name: "Firebase" } }, categories: [{ name: "Portability", facts: [
    { entity: "a", label: "Database", value: "Supabase uses PostgreSQL", sourceUrl: "https://supabase.com/docs", sourceTitle: "Supabase docs", confidence: 0.9 },
  ] }] };
});

it("answers from cited saved-report facts when a cached comparison has no normalized rows", async () => {
  const answer = await answerFollowUp("cached-comparison", "owner", "What database does Supabase use?");
  expect(answer.type).toBe("grounded");
  expect(answer.evidence).toEqual([expect.objectContaining({ value: "Supabase uses PostgreSQL", sourceUrl: "https://supabase.com/docs" })]);
});

it("keeps insufficient evidence behavior for saved reports without citations", async () => {
  state.result = { categories: [{ name: "Portability", facts: [{ entity: "a", value: "Unsupported claim", confidence: 0.9 }] }] };
  const answer = await answerFollowUp("cached-comparison", "owner", "What database?");
  expect(answer.type).toBe("insufficient");
  expect(state.generated).not.toHaveBeenCalled();
});
