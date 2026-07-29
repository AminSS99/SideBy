import { test, expect } from "@playwright/test";
import { mockAppApi, seedTestAuth, WORKSPACE_JSON, usageJson } from "./fixtures";

test.describe("SideBy Production Hardening E2E Tests", () => {
  // Test 1: Verify sign-in redirect for anonymous users
  test("1. Anonymous user visiting /app is redirected to /auth/sign-in", async ({ page }) => {
    await page.goto("/app");
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });

  // Test 2: Expressing interest landing redirect
  test("2. Searching on landing page redirects anonymous user to sign-in, retaining redirect_url", async ({ page }) => {
    await mockAppApi(page);
    // Intercept validate preflight endpoint to mock ready state
    await page.route("**/api/comparisons/validate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          intent: {
            status: "ready",
            canStart: true,
            confidence: 0.98,
            entityA: "Supabase",
            entityB: "Firebase",
            category: "developer_tool",
            label: "Developer Tools",
            safetyLevel: "standard",
            message: "Ready to compare Supabase and Firebase.",
          },
          relation: "comparable",
          source: "rules",
        }),
      });
    });

    await page.goto("/");
    const inputA = page.getByPlaceholder("e.g. Supabase");
    const inputB = page.getByPlaceholder("e.g. Firebase");
    await expect(inputA).toBeVisible();
    await inputA.fill("Supabase");
    await inputB.fill("Firebase");

    const compareBtn = page.getByRole("button", { name: /Research this decision/i });
    await expect(compareBtn).toBeEnabled();
    await compareBtn.click();

    // Verify it redirects to sign-in preserving original interest
    await expect(page).toHaveURL(/\/auth\/sign-in\?redirect_url=/);
    const redirectUrl = decodeURIComponent(new URL(page.url()).searchParams.get("redirect_url") || "");
    expect(redirectUrl).toBe("/app/comparisons?q=Supabase vs Firebase");
  });

  // Test 3: Full comparison flow using mock sign-in bypass
  test("3. Authenticated quickstart comparison flow loads input values", async ({ page }) => {
    await mockAppApi(page);
    // Navigate straight to sign-in with query
    await page.goto("/auth/sign-in?redirect_url=/app/comparisons?q=Supabase vs Firebase");

    // Click mock authentication button
    const mockAuthBtn = page.locator("#test-auth-btn");
    await expect(mockAuthBtn).toBeVisible();
    await mockAuthBtn.click();

    // Verify redirection back to workspace comparisons view
    await expect(page).toHaveURL(/\/app\/comparisons/);

    // Verify the query from the quickstart is focused and pre-filled in the comparison box
    const inputA = page.getByPlaceholder("e.g. Supabase");
    const inputB = page.getByPlaceholder("e.g. Firebase");
    await expect(inputA).toBeVisible();
    await expect(inputA).toHaveValue("Supabase");
    await expect(inputB).toHaveValue("Firebase");
  });

  // Test 4: Political/Personal blocking in the browser UI
  test("4. safety block blocks person-vs-person queries on landing page", async ({ page }) => {
    await page.route("**/api/comparisons/validate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          intent: {
            status: "sensitive",
            canStart: false,
            confidence: 0.99,
            entityA: "Donald Trump",
            entityB: "Joe Biden",
            category: "sensitive",
            label: "Sensitive",
            safetyLevel: "blocked",
            message: "SideBy avoids person-vs-person rankings. Compare products, organizations, roles, or public facts instead.",
            policyNote: "People comparison",
          },
          relation: "unsafe",
          source: "rules",
        }),
      });
    });

    await page.goto("/");
    const inputA = page.getByPlaceholder("e.g. Supabase");
    const inputB = page.getByPlaceholder("e.g. Firebase");
    await inputA.fill("Donald Trump");
    await inputB.fill("Joe Biden");

    // Preflight block notice is displayed
    await expect(page.getByText("SideBy avoids person-vs-person rankings")).toBeVisible();

    // Compare button is disabled and page url stays standard
    const compareBtn = page.getByRole("button", { name: /Research this decision/i });
    await expect(compareBtn).toBeDisabled();
    await expect(page).toHaveURL(/\/$/);
  });

  // Test 5: Shared SnapSolve pricing handoff
  test("5. Free workspace opens the shared SnapSolve plans", async ({ page }) => {
    await seedTestAuth(page);

    await page.route("**/api/workspaces", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(WORKSPACE_JSON) }),
    );
    await page.route("**/api/usage", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(usageJson("free")) }),
    );

    await page.goto("/app/billing");
    await expect(page).toHaveURL(/\/app\/billing/);

    const sharedPlansLink = page.getByRole("link", { name: "Open SnapSolve Plans" });
    await expect(sharedPlansLink).toBeVisible();
    await expect(sharedPlansLink).toHaveAttribute("href", "https://snapsolve.ink/cockpit/#/subscription");
  });

  // Test 6: Paid shared subscription management
  test("6. SnapSolve-managed plan opens the central subscription cockpit", async ({ page }) => {
    await seedTestAuth(page);

    await page.route("**/api/workspaces", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(WORKSPACE_JSON) }),
    );
    await page.route("**/api/usage", async (route) => {
      const paidUsage = usageJson("pro");
      paidUsage.subscription.billingProvider = "snapsolve";
      paidUsage.subscription.source = "snapsolve_entitlement";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(paidUsage),
      });
    });

    await page.goto("/app/billing");
    await expect(page).toHaveURL(/\/app\/billing/);

    await expect(page.getByText("Pulse Plan")).toBeVisible();
    const manageLink = page.getByRole("link", { name: "Manage in SnapSolve" });
    await expect(manageLink).toBeVisible();
    await expect(manageLink).toHaveAttribute("href", "https://snapsolve.ink/cockpit/#/subscription");
  });
});
