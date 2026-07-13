import { test, expect } from "@playwright/test";
import {
  seedTestAuth,
  WORKSPACE_JSON,
  usageJson,
  createJobResponse,
  createPartialJobResponse,
  comparisonJobCompletedResponse,
} from "./fixtures";

const COMPARISON_ID = "cmp_e2e_001";

async function setupComparison(page: import("@playwright/test").Page) {
  await seedTestAuth(page);
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
  const inputA = page.getByPlaceholder("Product or framework A (e.g. Supabase)");
  const inputB = page.getByPlaceholder("Product or framework B (e.g. Firebase)");
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

  await expect(page.getByText(/Comparison Fit —/)).toBeVisible();
  await page.getByRole("button", { name: "Compare Options" }).click();
}

test.describe("SideBy Authenticated Comparison Flow", () => {
  test("creates a comparison and renders the completed result workbench", async ({ page }) => {
    let createCalls = 0;
    await seedTestAuth(page);
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
      page.getByText(/Open-source Firebase alternative|Google app development platform/i).first(),
    ).toBeVisible();
    await expect(page.getByText(/open-source portability and Postgres fidelity/i).first()).toBeVisible();

    await expect(page.getByRole("heading", { name: "Decision Matrix", exact: true })).toBeVisible();
    await expect(page.getByText("Best Overall").first()).toBeVisible();

    await expect(page.getByRole("heading", { name: /sources reviewed/i })).toBeVisible();
    await expect(page.getByText("Supabase Pricing").first()).toBeVisible();
    await expect(page.getByText("Firebase Pricing").first()).toBeVisible();

    expect(createCalls).toBe(1);
  });

  test("completed comparison opens the export modal", async ({ page }) => {
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
    await seedTestAuth(page);
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
    await expect(page.getByText(/open-source portability and Postgres fidelity/i).first()).toBeVisible();
  });
});
