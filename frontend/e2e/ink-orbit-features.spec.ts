import { test, expect } from "@playwright/test";

test("feature workflow supports source selection and keyboard score exploration", async ({ page }) => {
  await page.goto("/features");
  const consent = page.getByRole("button", { name: "Essential only", exact: true });
  if (await consent.isVisible()) await consent.click();
  const section = page.locator(".ib-root");
  await section.getByRole("button", { name: "Uploads", exact: true }).click();
  await expect(section.getByRole("button", { name: "Uploads", exact: true })).toHaveAttribute("aria-pressed", "true");
  const slider = section.getByRole("slider", { name: "Explore example scores" });
  await slider.focus();
  await slider.press("End");
  await expect(section.locator("output")).toHaveText("Fit: 76 / 100");
  await slider.press("Home");
  await slider.press("ArrowRight");
  await expect(section.locator("output")).toHaveText("Pricing: 82 / 100");
});

test("feature workflow remains readable and interactive at 320px with reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 750 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/features");
  const section = page.locator(".ib-root");
  await section.scrollIntoViewIfNeeded();
  await expect(section.getByRole("heading", { name: "Research that stays connected" })).toBeVisible();
  await expect(section.locator("animateMotion")).toHaveCount(0);
  const controls = await section.locator("button, input[type=range]").evaluateAll(elements =>
    elements.map(element => element.getBoundingClientRect().height),
  );
  expect(controls.every(height => height >= 44)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("public features restart offline after the production service worker is ready", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "Service worker offline restart is checked on Chromium.");
  test.setTimeout(60_000);
  await page.goto("/features");
  await page.getByRole("heading", { name: /From open question/ }).waitFor();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  if (!await page.evaluate(() => Boolean(navigator.serviceWorker.controller))) await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(".ib-root").getByRole("heading", { name: "Research that stays connected" })).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
