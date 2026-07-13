import type { Page, Route } from "@playwright/test";

export const TEST_WORKSPACE_ID = "ws_123";
export const TEST_USER_ID = "user_test_mock";

export const WORKSPACE_JSON = {
  workspaces: [
    {
      id: TEST_WORKSPACE_ID,
      name: "Test Workspace",
      slug: "test-ws",
      plan: "free",
      ownerId: TEST_USER_ID,
      ownerType: "user",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
    },
  ],
};

export function usageJson(plan: "free" | "pro" = "free") {
  const limits =
    plan === "free"
      ? {
          comparisonsPerDay: 5,
          followUpsPerDay: 10,
          refreshesPerDay: 3,
          exportsPerDay: 10,
        }
      : {
          comparisonsPerDay: 999,
          followUpsPerDay: 999,
          refreshesPerDay: 999,
          exportsPerDay: 999,
        };
  const message = plan === "free" ? "You are on the free SideBy plan." : "Active subscription.";
  return {
    plan,
    limits,
    usage: {},
    billingConfigured: true,
    subscription: {
      source: plan === "free" ? "free_fallback" : "local_subscription",
      status: plan === "free" ? "unknown" : "active",
      billingProvider: "dodo",
      entitlement: null,
      snapsolveWorkspace: null,
    },
    message,
  };
}

/**
 * A completed comparison payload shaped exactly like the ComparisonData the
 * frontend expects (types.ts). Used both for the job POST response and the
 * per-comparison GET that feeds the ComparisonDetailPage workbench.
 */
export const COMPARISON_RESULT = {
  slug: "supabase-vs-firebase",
  query: "Supabase vs Firebase",
  context: "developer_tool",
  taxonomy: {
    category: "developer_tool",
    label: "Developer Tools",
    status: "ready",
    safetyLevel: "standard",
  },
  entities: {
    a: { name: "Supabase", subtitle: "Open-source Firebase alternative", mark: "S", hex: "#3ECF8E" },
    b: { name: "Firebase", subtitle: "Google app development platform", mark: "F", hex: "#FFCA28" },
  },
  sourceCount: 7,
  updatedAt: "2025-06-01T00:00:00.000Z",
  verdict: {
    bestOverall: "Supabase",
    bestValue: "Supabase (free tier)",
    developers: "Supabase",
    teams: "Firebase",
    students: "Supabase",
    powerUsers: "Firebase",
    ecosystem: "Depends on stack",
    summary:
      "Supabase wins on open-source portability and Postgres fidelity; Firebase leads on real-time scale and managed infra.",
  },
  dimensions: [
    { subject: "Pricing", a: 90, b: 70, fullMark: 100 },
    { subject: "Realtime", a: 75, b: 95, fullMark: 100 },
    { subject: "Ecosystem", a: 70, b: 90, fullMark: 100 },
  ],
  consensus: ["Both are managed backend-as-a-service platforms"],
  contradictions: ["Supabase is open-source; Firebase is proprietary"],
  categories: [
    {
      name: "Pricing",
      winner: "a",
      verdict: "Supabase offers a more generous free tier and predictable usage-based billing.",
      facts: [
        {
          entity: "a",
          label: "Free tier",
          value: "500 MB database, 2 GB egress",
          source: "Supabase pricing",
          sourceUrl: "https://supabase.com/pricing",
          sourceTitle: "Supabase Pricing",
          confidence: 0.95,
          freshness: "Fresh",
        },
        {
          entity: "b",
          label: "Free tier",
          value: "1 GB database, 10 GB egress",
          source: "Firebase pricing",
          sourceUrl: "https://firebase.google.com/pricing",
          sourceTitle: "Firebase Pricing",
          confidence: 0.95,
          freshness: "Fresh",
        },
      ],
    },
  ],
  sources: [
    {
      title: "Supabase Pricing",
      url: "https://supabase.com/pricing",
      reliability: "Official",
      sourceType: "web",
      extractionMethod: "tavily",
      fetchedAt: "2025-06-01T00:00:00.000Z",
      confidence: 0.95,
    },
    {
      title: "Firebase Pricing",
      url: "https://firebase.google.com/pricing",
      reliability: "Official",
      sourceType: "web",
      extractionMethod: "tavily",
      fetchedAt: "2025-06-01T00:00:00.000Z",
      confidence: 0.95,
    },
  ],
  telemetry: {
    latencyMs: 18230,
    inputTokens: 4200,
    outputTokens: 1800,
    estimatedCost: 0.0312,
    models: ["deepseek-chat"],
  },
};

/** The JSON returned by POST /api/comparisons (create job). */
export function createJobResponse(id = "cmp_12345") {
  return {
    id,
    status: "running",
    progress: 0,
    query: "Supabase vs Firebase",
    result: {
      slug: "supabase-vs-firebase",
      sourceCount: 0,
      verdict: { summary: "" },
      entities: {
        a: { name: "Supabase", subtitle: "", mark: "S", hex: "#3ECF8E" },
        b: { name: "Firebase", subtitle: "", mark: "F", hex: "#FFCA28" },
      },
    },
    visibility: "private",
  };
}

/** A minimal early job response before entity previews have been enriched. */
export function createPartialJobResponse(id = "cmp_12345") {
  return {
    id,
    status: "running",
    progress: 0,
    query: "Supabase vs Firebase",
    result: {
      slug: "supabase-vs-firebase",
    },
    visibility: "private",
  };
}

/** The JSON returned by GET /api/comparisons/:id once completed. */
export function comparisonJobCompletedResponse(id = "cmp_12345") {
  return {
    id,
    status: "completed",
    progress: 100,
    activeStep: 8,
    query: "Supabase vs Firebase",
    result: COMPARISON_RESULT,
    visibility: "private",
    error: null,
    failedStep: null,
    retryable: false,
    activity: [
      {
        id: "st-1",
        task: "Parse query",
        stepName: "parsing",
        status: "completed",
        startedAt: "2025-06-01T00:00:00.000Z",
        completedAt: "2025-06-01T00:00:01.000Z",
        durationMs: 1000,
        inputSummary: "Supabase vs Firebase",
        outputSummary: "entities detected",
        error: null,
      },
    ],
  };
}

/** Auth payload for the landing-page validate preflight mock. */
export function validateReadyResponse(entityA = "Supabase", entityB = "Firebase") {
  return {
    intent: {
      status: "ready",
      canStart: true,
      confidence: 0.96,
      entityA,
      entityB,
      category: "developer_tool",
      label: "Developer Tools",
      safetyLevel: "standard",
      message: `Ready to compare ${entityA} and ${entityB}.`,
    },
    relation: "comparable",
    source: "rules",
  };
}

export function validateBlockedResponse(entityA = "Donald Trump", entityB = "Joe Biden") {
  return {
    intent: {
      status: "sensitive",
      canStart: false,
      confidence: 0.96,
      entityA,
      entityB,
      category: "sensitive",
      label: "Sensitive",
      safetyLevel: "blocked",
      message: "SideBy avoids person-vs-person rankings. Compare products, organizations, roles, or public facts instead.",
      policyNote: "People comparison",
    },
    relation: "unsafe",
    source: "rules",
  };
}

/** Register default API responses so browser tests do not depend on Vite's API proxy. */
export async function mockAppApi(page: Page) {
  await page.route("**/api/csrf", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ csrfToken: "test-csrf-token" }),
    }),
  );
  await page.route("**/api/workspaces", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(WORKSPACE_JSON) }),
  );
  await page.route("**/api/usage", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(usageJson("free")) }),
  );
  await page.route("**/api/projects**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ projects: [] }) }),
  );
  await page.route(/\/api\/comparisons(?:\?.*)?$/, (route) => {
    if (route.request().method() !== "GET") return route.continue();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ comparisons: [] }),
    });
  });
  await page.route("**/api/decision-matrices**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ matrices: [] }) }),
  );
  await page.route("**/api/watchlists**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ watchlists: [] }) }),
  );
}

/**
 * Enable the dev-only test-auth bypass by seeding localStorage before any
 * navigation. The AuthContext reads these keys to synthesize a mock user.
 */
export async function seedTestAuth(page: Page, workspaceId = TEST_WORKSPACE_ID) {
  await mockAppApi(page);
  await page.goto("/");
  await page.evaluate(
    ({ workspaceId }) => {
      localStorage.setItem("sideby.test.auth", "true");
      localStorage.setItem("sideby.activeWorkspaceId", workspaceId);
    },
    { workspaceId },
  );
}

/**
 * Register a mock route and return a promise that resolves with the captured
 * request body once the endpoint is hit, so tests can assert the exact payload.
 */
export async function expectJsonPost(page: Page, urlGlob: string) {
  let resolveBody: (body: unknown) => void;
  const bodyPromise = new Promise<unknown>((resolve) => {
    resolveBody = resolve;
  });
  await page.route(urlGlob, async (route: Route) => {
    const body = route.request().postDataJSON();
    resolveBody(body);
    await route.continue();
  });
  return () => bodyPromise;
}
