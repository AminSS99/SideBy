import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { seedTestAuth, WORKSPACE_JSON, usageJson } from "./fixtures";

test.describe("SideBy Accessibility (a11y) Tests", () => {
  test("1. Landing page is accessible and supports keyboard navigation", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("h1");
    // Wait for GSAP transitions to finish to settle opacity for color-contrast verification
    await page.waitForTimeout(1500);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Keyboard navigation validation:
    // Focus should be tab-navigable to the main comparison input
    const input = page.locator("#hero-comparison-input");
    await page.keyboard.press("Tab");
    // Depending on other links in the header, tab a few times to reach the input
    let inputIsFocused = false;
    for (let i = 0; i < 10; i++) {
      const activeElementId = await page.evaluate(() => document.activeElement?.id);
      if (activeElementId === "hero-comparison-input") {
        inputIsFocused = true;
        break;
      }
      await page.keyboard.press("Tab");
    }
    expect(inputIsFocused).toBe(true);
  });

  test("2. Sign-in page is accessible", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await page.waitForSelector("#test-auth-btn");
    // Settle transitions
    await page.waitForTimeout(1500);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("3. App Billing page is accessible", async ({ page }) => {
    await seedTestAuth(page);
    await page.route("**/api/workspaces", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(WORKSPACE_JSON) }),
    );
    await page.route("**/api/usage", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(usageJson("free")) }),
    );

    await page.goto("/app/billing");
    await page.waitForSelector("button:has-text('Upgrade to Pro')");
    // Settle transitions
    await page.waitForTimeout(1500);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
