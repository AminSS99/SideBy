import { test, expect } from "@playwright/test";
import {
  seedTestAuth,
  WORKSPACE_JSON,
  usageJson,
  createJobResponse,
  comparisonJobCompletedResponse,
  validateReadyResponse,
  validateBlockedResponse,
  mockAppApi,
} from "./fixtures";

const COMPARISON_ID = "cmp_composer_e2e";

test.describe("SideBy Comparison Composer E2E", () => {
  test.beforeEach(async ({ page }) => {
    await mockAppApi(page);
  });

  test("should allow inputting entities, adding context, and shows validation badge", async ({ page }) => {
    await page.route("**/api/comparisons/validate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(validateReadyResponse("React", "Vue")),
      });
    });

    await page.goto("/");

    // Enter entities A and B
    const inputA = page.getByPlaceholder("Product or framework A (e.g. Supabase)");
    const inputB = page.getByPlaceholder("Product or framework B (e.g. Firebase)");
    await inputA.fill("React");
    await inputB.fill("Vue");

    // Toggle and fill context
    const addContextBtn = page.getByRole("button", { name: /Add Context/i });
    await expect(addContextBtn).toBeVisible();
    await addContextBtn.click();

    const contextInput = page.getByPlaceholder("Context or Use Case (optional, e.g. for real-time SaaS)");
    await expect(contextInput).toBeVisible();
    await contextInput.fill("SaaS apps");

    // Verify validation preflight badge
    await expect(page.getByText(/Comparison Fit —/)).toBeVisible();
    await expect(page.getByText("Developer Tools")).toBeVisible();
  });

  test("should handle suggestions chip clicks", async ({ page }) => {
    await page.route("**/api/comparisons/validate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(validateReadyResponse("React", "Vue")),
      });
    });

    await page.goto("/");

    // Click React vs Vue suggestion chip
    const suggestionChip = page.getByRole("button", { name: "React vs Vue for SaaS products" });
    await expect(suggestionChip).toBeVisible();
    await suggestionChip.click();

    // Verify inputs populated automatically
    const inputA = page.getByPlaceholder("Product or framework A (e.g. Supabase)");
    const inputB = page.getByPlaceholder("Product or framework B (e.g. Firebase)");
    await expect(inputA).toHaveValue("React");
    await expect(inputB).toHaveValue("Vue");

    const contextInput = page.getByPlaceholder("Context or Use Case (optional, e.g. for real-time SaaS)");
    await expect(contextInput).toHaveValue("SaaS products");
  });

  test("should display sensitive block policy notes for unsafe content", async ({ page }) => {
    await page.route("**/api/comparisons/validate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(validateBlockedResponse("Donald Trump", "Joe Biden")),
      });
    });

    await page.goto("/");

    const inputA = page.getByPlaceholder("Product or framework A (e.g. Supabase)");
    const inputB = page.getByPlaceholder("Product or framework B (e.g. Firebase)");
    await inputA.fill("Donald Trump");
    await inputB.fill("Joe Biden");

    // Check block banner
    await expect(page.getByText("Comparison Blocked")).toBeVisible();
    await expect(page.getByText(/SideBy avoids person-vs-person/)).toBeVisible();

    const compareBtn = page.getByRole("button", { name: /Compare Options/i });
    await expect(compareBtn).toBeDisabled();
  });

  test("should guide incomplete pairs without treating them as blocked", async ({ page }) => {
    await page.goto("/");

    const inputA = page.getByPlaceholder("Product or framework A (e.g. Supabase)");
    await inputA.fill("React");

    await expect(page.getByText("Complete the pair")).toBeVisible();
    await expect(page.getByText("Enter both options to check whether they are a meaningful comparison.")).toBeVisible();
    await expect(page.getByText("Comparison Blocked")).not.toBeVisible();
  });

  test("should redirect anonymous users to sign-in after submitting a valid query", async ({ page }) => {
    await page.route("**/api/comparisons/validate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(validateReadyResponse("React", "Vue")),
      });
    });

    await page.goto("/");

    const inputA = page.getByPlaceholder("Product or framework A (e.g. Supabase)");
    const inputB = page.getByPlaceholder("Product or framework B (e.g. Firebase)");
    await inputA.fill("React");
    await inputB.fill("Vue");

    const compareBtn = page.getByRole("button", { name: /Compare Options/i });
    await expect(compareBtn).toBeEnabled();
    await compareBtn.click();

    // Anonymous check redirections
    await expect(page).toHaveURL(/\/auth\/sign-in\?redirect_url=/);
    expect(decodeURIComponent(new URL(page.url()).searchParams.get("redirect_url") || ""))
      .toBe("/app/comparisons?q=React vs Vue");
  });
});

test.describe("SideBy Authenticated Result Interactive Evidence Panel E2E", () => {
  test.beforeEach(async ({ page }) => {
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
  });

  test("should open the evidence panel drawer when clicking on matrix elements", async ({ page }) => {
    await page.goto(`/app/comparisons/${COMPARISON_ID}`);

    // Wait for the workbench to render
    await expect(page.getByText("Supabase vs Firebase").first()).toBeVisible();

    // Click on a row in the Feature Matrix panel (Free tier card)
    const pricingCard = page.locator('.hidden.md\\:block div[role="button"]').filter({ hasText: "Free tier" }).first();
    await expect(pricingCard).toBeVisible();
    await pricingCard.click();

    // Radix Dialog / Vaul Drawer should open and display the evidence header and supporting facts
    await expect(page.getByText("Source-Backed Decision Evidence").first()).toBeVisible();
    await expect(page.locator("h2, h3, [role='heading'], .font-serif").filter({ hasText: "Pricing" }).first()).toBeVisible();
    await expect(page.getByText("500 MB database, 2 GB egress").first()).toBeVisible();
    await expect(page.getByText("1 GB database, 10 GB egress").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Supabase Pricing" }).first()).toBeVisible();

    // Close the panel
    const closeBtn = page.getByRole("button", { name: "Close" }).or(page.locator("button:has-text('Close')")).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await page.keyboard.press("Escape");
    }

    await expect(page.getByRole("heading", { name: "Pricing Evidence", exact: true })).not.toBeVisible();
  });

  test("should open decision evidence without interfering with the importance slider", async ({ page }) => {
    await page.goto(`/app/comparisons/${COMPARISON_ID}`);

    const importanceSlider = page.getByRole("slider", { name: "Importance of Pricing" });
    await expect(importanceSlider).toBeVisible();
    await importanceSlider.focus();
    await page.keyboard.press("ArrowRight");
    await expect(importanceSlider).toHaveValue("4");

    const evidenceButton = page.getByRole("button", { name: "View evidence for Pricing" });
    await expect(evidenceButton).toBeVisible();
    await evidenceButton.click();

    await expect(page.getByText("Source-Backed Decision Evidence").first()).toBeVisible();
  });
});

test.describe("SideBy Accessibility Prefers Reduced Motion E2E", () => {
  // Emulate reduced motion
  test.use({ prefersReducedMotion: "reduce" });

  test("should load landing page correctly with prefers-reduced-motion active", async ({ page }) => {
    await page.goto("/");
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
    // Verify landing page does not crash and displays content correctly
    await expect(page.getByPlaceholder("Product or framework A (e.g. Supabase)")).toBeVisible();
  });
});
