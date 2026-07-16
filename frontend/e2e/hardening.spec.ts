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
    const inputA = page.getByPlaceholder("Product or framework A (e.g. Supabase)");
    const inputB = page.getByPlaceholder("Product or framework B (e.g. Firebase)");
    await expect(inputA).toBeVisible();
    await inputA.fill("Supabase");
    await inputB.fill("Firebase");

    const compareBtn = page.getByRole("button", { name: /^Compare/ });
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
    const inputA = page.getByPlaceholder("Product or framework A (e.g. Supabase)");
    const inputB = page.getByPlaceholder("Product or framework B (e.g. Firebase)");
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
    const inputA = page.getByPlaceholder("Product or framework A (e.g. Supabase)");
    const inputB = page.getByPlaceholder("Product or framework B (e.g. Firebase)");
    await inputA.fill("Donald Trump");
    await inputB.fill("Joe Biden");

    // Preflight block notice is displayed
    await expect(page.getByText("SideBy avoids person-vs-person rankings")).toBeVisible();

    // Compare button is disabled and page url stays standard
    const compareBtn = page.getByRole("button", { name: /^Compare/ });
    await expect(compareBtn).toBeDisabled();
    await expect(page).toHaveURL(/\/$/);
  });

  // Test 5: Subscriptions checkout redirect
  test("5. Checkout triggers /api/billing/checkout and redirects to checkout URL", async ({ page }) => {
    let checkoutRequestPayload: { plan?: string } | null = null;

    await seedTestAuth(page);

    // Intercept checkout redirect
    await page.route("**/api/billing/checkout", async (route) => {
      checkoutRequestPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          checkoutUrl: "https://test.dodopayments.com/mock-checkout-url",
        }),
      });
    });

    await page.route("**/api/workspaces", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(WORKSPACE_JSON) }),
    );
    await page.route("**/api/usage", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(usageJson("free")) }),
    );

    // Prevent actual page unload to mock external checkout host
    await page.route("https://test.dodopayments.com/mock-checkout-url", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html>Mock Checkout Page</html>",
      });
    });

    await page.goto("/app/billing");
    await expect(page).toHaveURL(/\/app\/billing/);

    const upgradeProBtn = page.getByRole("button", { name: "Upgrade to Pro" });
    await expect(upgradeProBtn).toBeVisible();

    const checkoutRedirectPromise = page.waitForRequest("https://test.dodopayments.com/mock-checkout-url");
    await upgradeProBtn.click();
    await checkoutRedirectPromise;

    expect(checkoutRequestPayload).toEqual({ plan: "pro" });
  });

  // Test 6: Subscriptions customer portal redirect
  test("6. Customer Portal triggers /api/billing/portal and redirects to portal URL", async ({ page }) => {
    let portalCalled = false;

    await seedTestAuth(page);

    await page.route("**/api/billing/portal", async (route) => {
      portalCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          url: "https://test.dodopayments.com/mock-portal-url",
        }),
      });
    });

    await page.route("**/api/workspaces", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(WORKSPACE_JSON) }),
    );
    await page.route("**/api/usage", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(usageJson("pro")) }),
    );

    await page.route("https://test.dodopayments.com/mock-portal-url", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html>Mock Portal Page</html>",
      });
    });

    await page.goto("/app/billing");
    await expect(page).toHaveURL(/\/app\/billing/);

    const portalBtn = page.getByRole("button", { name: "Customer Portal" });
    await expect(portalBtn).toBeVisible();

    const portalRedirectPromise = page.waitForRequest("https://test.dodopayments.com/mock-portal-url");
    await portalBtn.click();
    await portalRedirectPromise;

    expect(portalCalled).toBe(true);
  });
});
