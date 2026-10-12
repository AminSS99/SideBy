import { test, expect } from "@playwright/test";
import { seedTestAuth, validateReadyResponse } from "./fixtures";

test.describe("SideBy Mobile & PWA Specifications", () => {
  test("1. Viewport has viewport-fit=cover and preserves user zoom", async ({ page }) => {
    await page.goto("/");
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(viewportMeta).toContain("width=device-width");
    expect(viewportMeta).toContain("viewport-fit=cover");
    expect(viewportMeta).not.toContain("user-scalable=no");
    expect(viewportMeta).not.toContain("maximum-scale=1");
  });

  test("2. App metadata and manifest links are intact", async ({ page }) => {
    await page.goto("/");
    const manifestLink = await page.locator('link[rel="manifest"]').count();
    expect(manifestLink).toBeGreaterThanOrEqual(1);

    const appleCapable = await page.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute("content");
    expect(appleCapable).toBe("yes");

    const appleIcon = await page.locator('link[rel="apple-touch-icon"]').count();
    expect(appleIcon).toBeGreaterThanOrEqual(1);
  });

  test("3. Root layout has no unintended horizontal overflow at 390px and 320px", async ({ page }) => {
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 750 });
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // 1px rounding tolerance
    }
  });

  test("4. Mobile input font-size is at least 16px to prevent iOS auto-zoom", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const inputA = page.locator("#hero-comparison-input");
    await expect(inputA).toBeVisible();

    const fontSize = await inputA.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });
    expect(fontSize).toBeGreaterThanOrEqual(16);
  });

  test("5. Mobile drawer has accessible dialog attributes and closes cleanly", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedTestAuth(page);
    await page.goto("/app/comparisons");
    await page.waitForLoadState("domcontentloaded");

    const menuBtn = page.locator('button[aria-label="Open navigation"]');
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    const drawer = page.locator('aside[role="dialog"]');
    await expect(drawer).toBeVisible();
    expect(await drawer.getAttribute("aria-modal")).toBe("true");
    expect(await drawer.getAttribute("aria-label")).toContain("navigation drawer");

    // Test Escape key dismissal
    await page.keyboard.press("Escape");
    await expect(drawer).not.toBeVisible();

    // Re-open and test close button
    await menuBtn.click();
    await expect(drawer).toBeVisible();
    const closeBtn = page.locator('button[aria-label="Close navigation"]');
    await closeBtn.click();
    await expect(drawer).not.toBeVisible();
  });

  test("6. Comparison Composer double-tap submit lock prevents duplicate requests", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedTestAuth(page);

    // Settle the validation gate deterministically: without this mock the
    // composer validates against the dead dev-proxy backend and the submit
    // gate flakes under load (zero requests instead of exactly one).
    await page.route("**/api/comparisons/validate", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(validateReadyResponse("Next.js", "Remix")),
      }),
    );

    let comparisonPostRequests = 0;
    await page.route("**/api/comparisons", (route) => {
      if (route.request().method() === "POST") {
        comparisonPostRequests++;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "comp_mock_double_tap",
            status: "running",
            progress: 10,
            activeStep: 1,
            query: "Next.js vs Remix",
            result: null,
          }),
        });
      }
      return route.continue();
    });

    await page.goto("/app/comparisons");
    await page.waitForLoadState("domcontentloaded");

    const inputA = page.locator("#hero-comparison-input");
    const inputB = page.locator("#hero-comparison-input-b");
    await inputA.fill("Next.js");
    await inputB.fill("Remix");

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled();

    // Rapid double click
    await submitBtn.click({ clickCount: 2 });

    // Allow time for any accidental queued handlers
    await page.waitForTimeout(600);

    // Verify exactly one POST request was fired to create the comparison
    expect(comparisonPostRequests).toBe(1);
  });
});
