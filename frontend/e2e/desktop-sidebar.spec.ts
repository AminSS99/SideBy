import { expect, test } from "@playwright/test";
import { seedTestAuth } from "./fixtures";

test.use({ serviceWorkers: "block" });

test("desktop rail expands without shifting content and remembers its pin", async ({ page, isMobile }) => {
  test.skip(isMobile, "Exercises the desktop pointer and keyboard behavior.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seedTestAuth(page);
  await page.goto("/app/comparisons");

  const rail = page.getByRole("navigation", { name: "App navigation" }).locator("..");
  const main = page.getByRole("main");
  await expect(rail).toHaveCSS("width", "72px");
  const mainStart = (await main.boundingBox())!.x;

  await rail.getByRole("link", { name: "Compare", exact: true }).hover();
  await expect(rail).toHaveCSS("width", "248px");
  expect((await main.boundingBox())!.x).toBe(mainStart);
  const labelInFront = await rail.getByRole("link", { name: "Compare", exact: true }).evaluate((link) => {
    const rect = link.getBoundingClientRect();
    return link.contains(document.elementFromPoint(rect.left + 110, rect.top + rect.height / 2));
  });
  expect(labelInFront).toBe(true);

  await page.mouse.move(1000, 150);
  await expect(rail).toHaveCSS("width", "72px");
  const pin = rail.getByRole("button", { name: "Keep menu open" });
  await pin.focus();
  await expect(rail).toHaveCSS("width", "248px");
  await pin.press("Enter");
  await expect(rail.getByRole("button", { name: "Collapse menu" })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(async () => (await main.boundingBox())!.x).toBe(mainStart + 176);

  await page.reload();
  await expect(rail).toHaveCSS("width", "248px");
  await rail.getByRole("button", { name: "Collapse menu" }).click();
  await main.click({ position: { x: 550, y: 20 } });
  await expect(rail).toHaveCSS("width", "72px");
});
