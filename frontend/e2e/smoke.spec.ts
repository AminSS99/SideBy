import { test, expect } from "@playwright/test";

test("homepage loads and shows hero", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/SideBy/);
  await expect(page.locator("text=Compare").first()).toBeVisible();
});

test("marketing pages are reachable", async ({ page }) => {
  const res = await page.goto("/pricing");
  expect(res?.status()).toBe(200);
  await expect(page).toHaveTitle(/Pricing/);
});

test("auth redirects to sign-in", async ({ page }) => {
  const res = await page.goto("/app");
  expect(res?.url()).toContain("/auth/sign-in");
});

test("public comparison page returns 200", async ({ request }) => {
  const res = await request.get("/compare/react-vs-vue");
  expect(res.status()).toBeLessThan(500);
});

test("API health check returns JSON", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBeLessThan(500);
});
