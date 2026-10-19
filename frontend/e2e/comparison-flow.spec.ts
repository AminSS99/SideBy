import { test, expect } from "@playwright/test";
import {
  seedTestAuth,
  WORKSPACE_JSON,
  usageJson,
  createJobResponse,
  createPartialJobResponse,
  comparisonJobCompletedResponse,
  validateReadyResponse,
} from "./fixtures";

const COMPARISON_ID = "cmp_e2e_001";

/**
 * The workbench mounts desktop and mobile layouts side by side with one
 * hidden per viewport, so a bare `.first()` text match can resolve to the
 * hidden copy. Prefer the visible match to assert what the user sees.
 */
const visibleText = (page: import("@playwright/test").Page, text: string | RegExp) =>
  page.getByText(text).filter({ visible: true }).first();

async function setupComparison(page: import("@playwright/test").Page) {
  await seedTestAuth(page);
  await page.route("**/api/comparisons/validate", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(validateReadyResponse()),
    }),
  );
  await page.route("**/api/workspaces", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(WORKSPACE_JSON) }),
  );
  await page.route("**/api/usage", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(usageJson("free")) }),
  );
  await page.route("**/api/comparisons", async (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(createJobResponse(COMPARISON_ID)),
      });
    }
    return route.continue();
  });
  await page.route(`**/api/comparisons/${COMPARISON_ID}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(comparisonJobCompletedResponse(COMPARISON_ID)),
    }),
  );
}

async function startComparison(page: import("@playwright/test").Page, query: string) {
  const inputA = page.getByPlaceholder("e.g. Supabase");
  const inputB = page.getByPlaceholder("e.g. Firebase");
  await expect(inputA).toBeVisible();

  const parts = query.split(/\s+vs\.?\s+/i);
  const a = parts[0]?.trim() || "";
  const b = parts[1]?.split(/\s+for\s+/i)[0]?.trim() || "";
  const c = query.split(/\s+for\s+/i)[1]?.trim() || "";

  await inputA.fill(a);
  await inputB.fill(b);
  if (c) {
    const addContextBtn = page.getByRole("button", { name: /Add Context/i });
    if (await addContextBtn.isVisible()) {
      await addContextBtn.click();
    }
    const contextInput = page.getByPlaceholder("Context or Use Case (optional, e.g. for real-time SaaS)");
    await contextInput.fill(c);
  }

  const researchButton = page.getByRole("button", { name: /Research this decision/i });
  await expect(researchButton).toBeEnabled();
  await researchButton.click();
}

test.describe("SideBy Authenticated Comparison Flow", () => {
  test("creates a comparison and renders the completed result workbench", async ({ page }, testInfo) => {
    // The completed workbench (GSAP entrance, charts, panels) can exceed
    // the default 5s assertion budget under parallel CI load; triple it.
    // Unloaded renders land in ~250ms, so this only absorbs CI contention.
    test.slow();
    let createCalls = 0;
    await seedTestAuth(page);
    await page.route("**/api/comparisons/validate", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(validateReadyResponse()),
      }),
    );
    await page.route("**/api/workspaces", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(WORKSPACE_JSON) }),
    );
    await page.route("**/api/usage", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(usageJson("free")) }),
    );
    await page.route("**/api/comparisons", async (route) => {
      if (route.request().method() === "POST") {
        createCalls += 1;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(createJobResponse(COMPARISON_ID)),
        });
      }
      return route.continue();
    });
    await page.route(`**/api/comparisons/${COMPARISON_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(comparisonJobCompletedResponse(COMPARISON_ID)),
      }),
    );

    await page.goto("/app/comparisons");
    await expect(page).toHaveURL(/\/app\/comparisons/);

    await startComparison(page, "Supabase vs Firebase");

    // App navigates to the per-comparison workbench once the job is created.
    await expect(page).toHaveURL(new RegExp(`/app/comparisons/${COMPARISON_ID}`));

    // Completed result: entities, verdict summary, decision matrix, sources.
    await expect(page.getByText("Supabase vs Firebase").first()).toBeVisible();
    await expect(
      visibleText(page, /Open-source Firebase alternative|Google app development platform/i),
    ).toBeVisible();
    await expect(visibleText(page, /open-source portability and Postgres fidelity/i)).toBeVisible();

    await expect(visibleText(page, "Best Overall")).toBeVisible();

    // Sources live behind the metadata tab on mobile viewports.
    if (testInfo.project.name !== "chromium") {
      await page.getByRole("tab", { name: "Sources & Tech" }).click();
    }

    await expect(
      page.getByRole("heading", { name: /sources reviewed/i }).filter({ visible: true }).first(),
    ).toBeVisible();
    await expect(visibleText(page, "Supabase Pricing")).toBeVisible();
    await expect(visibleText(page, "Firebase Pricing")).toBeVisible();

    expect(createCalls).toBe(1);
  });

  test("completed comparison opens the export modal", async ({ page }) => {
    // Same heavy workbench page as above; allow headroom under CI load.
    test.slow();
    await setupComparison(page);
    await page.goto("/app/comparisons");
    await startComparison(page, "Supabase vs Firebase");
    await expect(page).toHaveURL(new RegExp(`/app/comparisons/${COMPARISON_ID}`));

    const exportBtn = page.getByRole("button", { name: /export/i }).first();
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();
    await expect(page.getByText(/markdown|export json/i, { exact: false }).first()).toBeVisible();
  });

  test("partial create response still opens the comparison workbench", async ({ page }) => {
    // Same heavy workbench page as above; allow headroom under CI load.
    test.slow();
    await seedTestAuth(page);
    await page.route("**/api/comparisons/validate", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(validateReadyResponse()),
      }),
    );
    await page.route("**/api/workspaces", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(WORKSPACE_JSON) }),
    );
    await page.route("**/api/usage", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(usageJson("free")) }),
    );
    await page.route("**/api/comparisons", async (route) => {
      if (route.request().method() === "POST") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(createPartialJobResponse(COMPARISON_ID)),
        });
      }
      return route.continue();
    });
    await page.route(`**/api/comparisons/${COMPARISON_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(comparisonJobCompletedResponse(COMPARISON_ID)),
      }),
    );

    await page.goto("/app/comparisons");
    await startComparison(page, "Supabase vs Firebase");

    await expect(page).toHaveURL(new RegExp(`/app/comparisons/${COMPARISON_ID}`));
    await expect(visibleText(page, /open-source portability and Postgres fidelity/i)).toBeVisible();
  });
});
