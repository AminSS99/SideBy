import { test, expect } from "@playwright/test";
import { mockAppApi } from "./fixtures";

const SMOKE_ORIGIN = process.env.SMOKE_ORIGIN || "https://sideby.ink";

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
  await page.goto("/app");
  await expect(page).toHaveURL(/\/auth\/sign-in/);
});

test("public comparison page returns 200", async ({ request }) => {
  const res = await request.get(`${SMOKE_ORIGIN}/compare/react-vs-vue`);
  expect(res.status()).toBeLessThan(500);
});

test("API health check returns JSON", async ({ request }) => {
  const res = await request.get(`${SMOKE_ORIGIN}/api/health`);
  expect(res.status()).toBeLessThan(500);
});

test("SEO and favicon assets are served", async ({ request }) => {
  const [sitemap, robots, svgIcon, icoIcon] = await Promise.all([
    request.get(`${SMOKE_ORIGIN}/sitemap.xml`),
    request.get(`${SMOKE_ORIGIN}/robots.txt`),
    request.get(`${SMOKE_ORIGIN}/icon.svg`),
    request.get(`${SMOKE_ORIGIN}/favicon.ico`),
  ]);

  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("<urlset");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Sitemap: https://sideby.ink/sitemap.xml");
  expect(svgIcon.status()).toBe(200);
  expect(svgIcon.headers()["content-type"]).toContain("image/svg+xml");
  expect(icoIcon.status()).toBe(200);
  expect(icoIcon.headers()["content-type"]).toContain("icon");
});

test("valid comparison leads an anonymous user to sign-in", async ({ page }) => {
  await mockAppApi(page);
  await page.route("**/api/comparisons/validate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        intent: {
          status: "ready",
          canStart: true,
          confidence: 0.96,
          entityA: "Astra",
          entityB: "Astro",
          category: "software",
          label: "Software",
          safetyLevel: "standard",
          message: "Ready to compare Astra and Astro as software.",
        },
        relation: "comparable",
        source: "rules",
      }),
    });
  });

  await page.goto("/");
  const inputA = page.getByPlaceholder("Product or framework A");
  const inputB = page.getByPlaceholder("Product or framework B");
  await inputA.fill("Astra");
  await inputB.fill("Astro");
  const compare = page.getByRole("button", { name: /^Compare/ });
  await expect(compare).toBeEnabled();
  await compare.click();

  await expect(page).toHaveURL(/\/auth\/sign-in\?redirect_url=/);
  expect(decodeURIComponent(new URL(page.url()).searchParams.get("redirect_url") || ""))
    .toBe("/app/comparisons?q=Astra vs Astro");
});

test("blocked comparison stays on the landing page", async ({ page }) => {
  await mockAppApi(page);
  await page.route("**/api/comparisons/validate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        intent: {
          status: "sensitive",
          canStart: false,
          confidence: 0.96,
          entityA: "Donald Trump",
          entityB: "Joe Biden",
          category: "sensitive",
          label: "Sensitive",
          safetyLevel: "blocked",
          message: "SideBy avoids person-vs-person rankings.",
          policyNote: "People comparison",
        },
        relation: "unsafe",
        source: "rules",
      }),
    });
  });

  await page.goto("/");
  const inputA = page.getByPlaceholder("Product or framework A");
  const inputB = page.getByPlaceholder("Product or framework B");
  await inputA.fill("Donald Trump");
  await inputB.fill("Joe Biden");
  await expect(page.getByText("SideBy avoids person-vs-person rankings.")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Compare/ })).toBeDisabled();
  await expect(page).toHaveURL(/\/$/);
});
