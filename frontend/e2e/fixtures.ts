import type { Page, Route } from "@playwright/test";

export const TEST_WORKSPACE_ID = "ws_123";
export const TEST_USER_ID = "user_test_mock";
const TEST_CONSENT = JSON.stringify({
  version: 1,
  policyVersion: "2026-07-14",
  analytics: "rejected",
  source: "banner",
  updatedAt: "2026-07-14T00:00:00.000Z",
});

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

/** Completed comparison payload for hardware products / devices archetype. */
export const DEVICE_COMPARISON_RESULT = {
  slug: "iphone-16-pro-vs-pixel-9-pro",
  query: "iPhone 16 Pro vs Pixel 9 Pro",
  context: "product",
  taxonomy: {
    category: "product",
    label: "Consumer Electronics",
    status: "ready",
    safetyLevel: "standard",
  },
  entities: {
    a: { name: "iPhone 16 Pro", subtitle: "Apple flagship smartphone", mark: "i", hex: "#475569" },
    b: { name: "Pixel 9 Pro", subtitle: "Google flagship smartphone", mark: "P", hex: "#0ea5e9" },
  },
  sourceCount: 6,
  updatedAt: "2025-09-01T00:00:00.000Z",
  verdict: {
    bestOverall: "iPhone 16 Pro",
    bestValue: "Pixel 9 Pro",
    developers: "iPhone 16 Pro",
    teams: "iPhone 16 Pro",
    students: "Pixel 9 Pro",
    powerUsers: "iPhone 16 Pro",
    ecosystem: "Apple Ecosystem vs Google AI",
    summary:
      "iPhone 16 Pro leads on raw silicon efficiency and video recording; Pixel 9 Pro leads on display brightness and generative photo tools.",
  },
  dimensions: [
    { subject: "Battery Life & Efficiency", a: 88, b: 82, fullMark: 100 },
    { subject: "Display & Peak Brightness", a: 95, b: 92, fullMark: 100 },
    { subject: "Camera & Optical Zoom", a: 94, b: 96, fullMark: 100 },
  ],
  consensus: ["Both are premium flagship smartphones with 120 Hz OLED panels and 5x telephoto lenses"],
  contradictions: ["Apple uses iOS with Apple Intelligence; Google uses Android with Gemini Nano"],
  categories: [
    {
      name: "Display & Optics",
      winner: "b",
      verdict: "Pixel leads on peak brightness while iPhone provides ProMotion adaptive color accuracy.",
      facts: [
        {
          entity: "a",
          label: "Display Brightness",
          value: "2000 nits peak outdoor brightness",
          source: "Apple Tech Specs",
          sourceUrl: "https://apple.com/iphone-16-pro/specs",
          sourceTitle: "iPhone 16 Pro Tech Specs",
          confidence: 0.95,
          freshness: "Fresh",
        },
        {
          entity: "b",
          label: "Display Brightness",
          value: "2050 nits peak outdoor brightness",
          source: "Google Store Specs",
          sourceUrl: "https://store.google.com/pixel_9_pro/specs",
          sourceTitle: "Pixel 9 Pro Tech Specs",
          confidence: 0.95,
          freshness: "Fresh",
        },
      ],
    },
    {
      name: "Battery & Charging",
      winner: "a",
      verdict: "iPhone demonstrates superior runtime efficiency under sustained media workloads.",
      facts: [
        {
          entity: "a",
          label: "Battery Capacity",
          value: "3582 mAh rechargeable lithium-ion battery",
          source: "Apple Battery Report",
          sourceUrl: "https://apple.com/iphone-16-pro/specs",
          sourceTitle: "iPhone 16 Pro Tech Specs",
          confidence: 0.92,
          freshness: "Fresh",
        },
        {
          entity: "b",
          label: "Battery Capacity",
          value: "4700 mAh battery with 27 W wired charging",
          source: "Google Pixel Battery",
          sourceUrl: "https://store.google.com/pixel_9_pro/specs",
          sourceTitle: "Pixel 9 Pro Tech Specs",
          confidence: 0.92,
          freshness: "Fresh",
        },
      ],
    },
  ],
  sources: [
    {
      title: "iPhone 16 Pro Tech Specs",
      url: "https://apple.com/iphone-16-pro/specs",
      reliability: "Official",
      sourceType: "web",
      extractionMethod: "tavily",
      fetchedAt: "2025-09-01T00:00:00.000Z",
      confidence: 0.95,
    },
    {
      title: "Pixel 9 Pro Tech Specs",
      url: "https://store.google.com/pixel_9_pro/specs",
      reliability: "Official",
      sourceType: "web",
      extractionMethod: "tavily",
      fetchedAt: "2025-09-01T00:00:00.000Z",
      confidence: 0.95,
    },
  ],
  telemetry: {
    latencyMs: 14200,
    inputTokens: 3800,
    outputTokens: 1600,
    estimatedCost: 0.028,
    models: ["deepseek-chat"],
  },
};

/** Completed comparison payload for general multi-criteria decisions archetype. */
export const GENERAL_COMPARISON_RESULT = {
  slug: "remote-work-vs-office-work",
  query: "Remote Work vs Office Work",
  context: "workplace",
  taxonomy: {
    category: "workplace",
    label: "Workplace & Workstyle",
    status: "ready",
    safetyLevel: "standard",
  },
  entities: {
    a: { name: "Remote Work", subtitle: "Distributed home-based model", mark: "R", hex: "#10b981" },
    b: { name: "Office Work", subtitle: "Colocated in-person model", mark: "O", hex: "#6366f1" },
  },
  sourceCount: 5,
  updatedAt: "2025-05-01T00:00:00.000Z",
  verdict: {
    bestOverall: "Remote Work",
    bestValue: "Remote Work",
    developers: "Remote Work",
    teams: "Office Work",
    students: "Remote Work",
    powerUsers: "Remote Work",
    ecosystem: "Hybrid balance",
    summary:
      "Remote Work offers superior autonomy, zero commute time, and deep focus; Office Work provides spontaneous collaboration and tighter team bonding.",
  },
  dimensions: [
    { subject: "Flexibility & Autonomy", a: 95, b: 50, fullMark: 100 },
    { subject: "Team Connection & Spontaneity", a: 60, b: 92, fullMark: 100 },
    { subject: "Work-Life Integration", a: 90, b: 65, fullMark: 100 },
  ],
  consensus: ["Both working models can achieve high productivity depending on organization culture and tooling"],
  contradictions: ["Remote work eliminates commuting while office work facilitates spontaneous face-to-face problem solving"],
  categories: [
    {
      name: "Productivity & Focus",
      winner: "a",
      verdict: "Remote work reduces commute fatigue and provides uninterrupted deep work blocks.",
      facts: [
        {
          entity: "a",
          label: "Commute Time",
          value: "0 hours daily commute",
          source: "Bureau of Labor Statistics",
          sourceUrl: "https://bls.gov/remote-work",
          sourceTitle: "Remote Work Statistics",
          confidence: 0.94,
          freshness: "Fresh",
        },
        {
          entity: "b",
          label: "Commute Time",
          value: "54 minutes average daily round trip",
          source: "Census Bureau",
          sourceUrl: "https://census.gov/commute",
          sourceTitle: "Commute Time Analysis",
          confidence: 0.94,
          freshness: "Fresh",
        },
      ],
    },
  ],
  sources: [
    {
      title: "Remote Work Statistics",
      url: "https://bls.gov/remote-work",
      reliability: "Official",
      sourceType: "web",
      extractionMethod: "tavily",
      fetchedAt: "2025-05-01T00:00:00.000Z",
      confidence: 0.94,
    },
    {
      title: "Commute Time Analysis",
      url: "https://census.gov/commute",
      reliability: "Official",
      sourceType: "web",
      extractionMethod: "tavily",
      fetchedAt: "2025-05-01T00:00:00.000Z",
      confidence: 0.94,
    },
  ],
  telemetry: {
    latencyMs: 12500,
    inputTokens: 3200,
    outputTokens: 1400,
    estimatedCost: 0.024,
    models: ["deepseek-chat"],
  },
};

export function deviceComparisonJobCompletedResponse(id = "cmp_device_test_456") {
  return {
    id,
    status: "completed",
    progress: 100,
    activeStep: 8,
    query: "iPhone 16 Pro vs Pixel 9 Pro",
    result: DEVICE_COMPARISON_RESULT,
    visibility: "private",
    error: null,
    failedStep: null,
    retryable: false,
    activity: [],
  };
}

export function generalComparisonJobCompletedResponse(id = "cmp_general_test_789") {
  return {
    id,
    status: "completed",
    progress: 100,
    activeStep: 8,
    query: "Remote Work vs Office Work",
    result: GENERAL_COMPARISON_RESULT,
    visibility: "private",
    error: null,
    failedStep: null,
    retryable: false,
    activity: [],
  };
}

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
  await page.route("**/api/consent**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }),
  );
  await page.route("**/api/comparisons/*/notes**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ notes: [] }) }),
  );
  await page.route("**/api/comparisons/*/versions**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ versions: [] }), }),
  );
}

/** Keep unrelated consent UI from covering controls in focused E2E flows. */
export async function seedEssentialConsent(page: Page) {
  await page.addInitScript((consent) => {
    localStorage.setItem("sideby.cookie-consent", consent);
  }, TEST_CONSENT);
}

/**
 * Enable the dev-only test-auth bypass by seeding localStorage before any
 * navigation. The AuthContext reads these keys to synthesize a mock user.
 */
export async function seedTestAuth(page: Page, workspaceId = TEST_WORKSPACE_ID) {
  await mockAppApi(page);
  await seedEssentialConsent(page);
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
