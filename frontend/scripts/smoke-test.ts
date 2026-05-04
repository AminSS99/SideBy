/**
 * SideBy Production Smoke Test
 *
 * Tests critical endpoints without requiring browser automation.
 * For authenticated flows, use manual testing or Playwright.
 *
 * Usage:
 *   BASE_URL=https://your-app.vercel.app npx tsx scripts/smoke-test.ts
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ${colors.green}✓${colors.reset} ${name}`);
    passed++;
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} ${name}`);
    console.log(`    ${colors.red}${error instanceof Error ? error.message : String(error)}${colors.reset}`);
    failed++;
  }
}

async function get(path: string) {
  const res = await fetch(`${BASE_URL}${path}`);
  return res;
}

async function post(path: string, body: unknown, headers?: Record<string, string>) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return res;
}

async function runTests() {
  console.log(`\n${colors.blue}🔥 SideBy Smoke Tests${colors.reset}`);
  console.log(`${colors.blue}   Base URL: ${BASE_URL}${colors.reset}\n`);

  // ─── Public Health Checks ───────────────────────────────────────────────
  console.log("Health Checks");

  await test("GET /api/health returns 200", async () => {
    const res = await get("/api/health");
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = (await res.json()) as { status: string; checks: Record<string, string> };
    if (data.status !== "healthy") throw new Error(`Status: ${data.status}`);
  });

  await test("Health check includes database", async () => {
    const res = await get("/api/health");
    const data = (await res.json()) as { checks: Record<string, string> };
    if (data.checks.database !== "ok") throw new Error("Database check failed");
  });

  // ─── Public Comparison Pages ────────────────────────────────────────────
  console.log("\nPublic Comparisons");

  await test("GET /compare/react-vs-vue-2024 (public)", async () => {
    const res = await get("/compare/react-vs-vue-2024");
    // The page should return 200 even if the comparison doesn't exist (React SPA)
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test("GET /api/comparisons/by-slug/react-vs-vue-2024", async () => {
    const res = await get("/api/comparisons/by-slug/react-vs-vue-2024");
    if (res.status === 404) {
      console.log(`    ${colors.yellow}⚠️  No seeded comparison found (run pnpm db:seed)${colors.reset}`);
      return;
    }
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = (await res.json()) as { status: string };
    if (data.status !== "completed") throw new Error(`Status: ${data.status}`);
  });

  // ─── API Route Availability ─────────────────────────────────────────────
  console.log("\nAPI Route Availability");

  await test("POST /api/comparisons/create requires auth", async () => {
    const res = await post("/api/comparisons/create", { query: "Test" });
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Expected 401/403, got ${res.status}`);
    }
  });

  await test("GET /api/comparisons/list requires auth", async () => {
    const res = await get("/api/comparisons/list");
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Expected 401/403, got ${res.status}`);
    }
  });

  await test("POST /api/comparisons/:id/follow-up requires auth", async () => {
    const res = await post("/api/comparisons/test-id/follow-up", { question: "Test" });
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Expected 401/403, got ${res.status}`);
    }
  });

  await test("POST /api/comparisons/:id/export requires auth", async () => {
    const res = await post("/api/comparisons/test-id/export", { format: "markdown" });
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Expected 401/403, got ${res.status}`);
    }
  });

  await test("POST /api/comparisons/:id/refresh requires auth", async () => {
    const res = await post("/api/comparisons/test-id/refresh", {});
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Expected 401/403, got ${res.status}`);
    }
  });

  // ─── Summary ────────────────────────────────────────────────────────────
  console.log(`\n${colors.blue}Results: ${passed} passed, ${failed} failed${colors.reset}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Smoke test error:", err);
  process.exit(1);
});
