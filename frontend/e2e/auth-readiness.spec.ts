import { test, expect } from "@playwright/test";
import { mockAppApi, seedEssentialConsent } from "./fixtures";

test.use({ serviceWorkers: "block" });

test.beforeEach(async ({ page }) => {
  await mockAppApi(page);
  await seedEssentialConsent(page);
});

test("keeps a comparison visible and preserves its destination between sign-in and signup", async ({ page }) => {
  const destination = "/app/comparisons?q=iPhone%20vs%20Pixel";
  await page.goto(`/auth/sign-in?redirect_url=${encodeURIComponent(destination)}`);
  await expect(page.getByRole("region", { name: "Your comparison" })).toContainText("iPhone vs Pixel");
  const createAccount = page.getByRole("link", { name: /Create one/ });
  await expect(createAccount).toHaveAttribute("href", `/auth/sign-up?redirect_url=${encodeURIComponent(destination)}`);
  await createAccount.click();
  await expect(page.getByRole("region", { name: "Your comparison" })).toContainText("iPhone vs Pixel");
  const signIn = page.getByRole("link", { name: /^Sign in/ });
  await expect(signIn).toHaveAttribute("href", `/auth/sign-in?redirect_url=${encodeURIComponent(destination)}`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test("keeps an external destination out of the auth continuation links", async ({ page }) => {
  await page.goto("/auth/sign-in?redirect_url=https%3A%2F%2Fexample.com%2Fapp");
  await expect(page.getByRole("link", { name: /Create one/ })).toHaveAttribute("href", "/auth/sign-up?redirect_url=%2Fapp");
  await expect(page.getByRole("region", { name: "Your comparison" })).toHaveCount(0);
});

test("leaves decorative particles still when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/auth/sign-in");
  await expect(page.getByRole("link", { name: /Create one/ })).toBeVisible();
  const hasPaintedParticles = await page.locator('canvas[aria-hidden="true"]').evaluate((canvas: HTMLCanvasElement) => {
    const pixels = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
    return pixels.some((value, index) => index % 4 === 3 && value > 0);
  });
  expect(hasPaintedParticles).toBe(false);
});
