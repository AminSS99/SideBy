import { describe, it, expect, vi, beforeEach } from "vitest";

import { applyMigration, migrateDirectory, type MigrationDb } from "../neon-migrate";

type RecordedQuery = { text: string; params?: unknown[] };

/**
 * Mock database with real transactional discipline: queries submitted
 * through `transaction()` execute in order, and the first failure discards
 * everything staged in that transaction (server-side rollback) while
 * propagating the error — so no COMMIT and no ledger write can follow.
 */
function makeMockDb(options: { failOn?: string } = {}) {
  const committed: RecordedQuery[] = [];
  const transactions = { count: 0 };
  const db = {
    query: async () => [] as unknown[],
    transaction: async (
      fn: (txn: { query: (text: string, params?: unknown[]) => Promise<unknown[]> }) => Promise<unknown[]>[],
    ) => {
      transactions.count += 1;
      const staged: RecordedQuery[] = [];
      const txn = {
        query: (text: string, params?: unknown[]) => {
          staged.push({ text, params });
          if (options.failOn && text.includes(options.failOn)) {
            return Promise.reject(new Error(`boom in ${options.failOn}`));
          }
          return Promise.resolve([]);
        },
      };
      const results = fn(txn);
      for (const result of results) {
        await result;
      }
      committed.push(...staged);
      return results;
    },
  };
  return { db: db as unknown as MigrationDb, committed, transactions };
}

const TWO_STATEMENT_MIGRATION = `-- probe migration
alter table comparisons add column if not exists intent_key text;
create unique index if not exists probe_uniq on comparisons (intent_key);
`;

describe("neon-migrate atomic apply", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends statements and the ledger write in a single transaction, in order", async () => {
    const { db, committed, transactions } = makeMockDb();

    const count = await applyMigration(db, "019_probe.sql", TWO_STATEMENT_MIGRATION);

    expect(count).toBe(2);
    expect(transactions.count).toBe(1);
    expect(committed).toHaveLength(3);
    expect(committed[0].text).toContain("alter table");
    expect(committed[1].text).toContain("create unique index");
    expect(committed[2].text).toContain("sideby_schema_migrations");
    expect(committed[2].params?.[0]).toBe("019_probe");
  });

  it("rolls back earlier statements and writes no ledger entry when a later statement fails", async () => {
    const { db, committed, transactions } = makeMockDb({ failOn: "create unique index" });

    await expect(applyMigration(db, "019_probe.sql", TWO_STATEMENT_MIGRATION)).rejects.toThrow(
      "boom in create unique index",
    );

    // Exactly one transaction was attempted and nothing survived it: the
    // first statement was rolled back and the ledger write never applied.
    expect(transactions.count).toBe(1);
    expect(committed).toEqual([]);
  });

  it("skips empty migrations without touching the database", async () => {
    const { db, committed, transactions } = makeMockDb();

    const count = await applyMigration(db, "020_empty.sql", "");

    expect(count).toBe(0);
    expect(transactions.count).toBe(0);
    expect(committed).toEqual([]);
  });

  it("refuses checksum-mismatched migrations instead of re-applying", async () => {
    const { db } = makeMockDb();
    const dirDb = {
      ...db,
      query: async () => [{ id: "019_probe", checksum: "deadbeef" }] as unknown[],
    } as unknown as MigrationDb;
    const { mkdtempSync, writeFileSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const dir = mkdtempSync(join(tmpdir(), "migrate-"));
    writeFileSync(join(dir, "019_probe.sql"), TWO_STATEMENT_MIGRATION);

    await expect(migrateDirectory(dirDb, dir)).rejects.toThrow("different checksum");
  });
});
