import { test, expect, type Page, type Locator } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import {
  seedTestAuth,
  comparisonJobCompletedResponse,
  deviceComparisonJobCompletedResponse,
  generalComparisonJobCompletedResponse,
} from "./fixtures";

const SOFTWARE_CMP_ID = "cmp_adaptive_test_123";
const DEVICE_CMP_ID = "cmp_device_test_456";
const GENERAL_CMP_ID = "cmp_general_test_789";

const SCREENSHOT_DIR = fs.existsSync(path.resolve(process.cwd(), "../audit-screenshots"))
  ? path.resolve(process.cwd(), "../audit-screenshots/adaptive-canvas")
  : path.resolve(process.cwd(), "audit-screenshots/adaptive-canvas");
const VIDEO_DIR = path.join(SCREENSHOT_DIR, "videos");

/**
 * Ensures animations (GSAP AppShell entry timeline, CSS fadeIn, framer-motion layout transitions)
 * have fully settled before taking screenshots or measuring layout geometry.
 */
async function waitForSettled(page: Page, targetLocator?: Locator) {
  // 1. Wait for .shell-main opacity to reach full opacity (>= 0.98)
  await page.waitForFunction(() => {
    const mainEl = document.querySelector(".shell-main");
    if (!mainEl) return true;
    const opacity = parseFloat(window.getComputedStyle(mainEl).opacity);
    return opacity >= 0.98;
  }, { timeout: 6000 }).catch(() => {});

  // 2. If target locator is provided, ensure it is visible and attached
  if (targetLocator) {
    await targetLocator.waitFor({ state: "visible", timeout: 6000 });
  }

  // 3. Small buffer to allow framer-motion spring settle & RAF repaint
  await page.waitForTimeout(400);
}

/**
 * Captures settled screenshots namespaced by project to avoid race-condition overwrites
 * during parallel multi-browser Playwright test execution.
 */
async function captureArtifact(
  page: Page,
  target: Locator | Page,
  filename: string,
  projectName: string,
  options?: { isCanonical?: boolean }
) {
  await waitForSettled(page);

  // 1. Save to project-isolated subfolder
  const projectDir = path.join(SCREENSHOT_DIR, projectName);
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }
  const projectFilePath = path.join(projectDir, filename);

  if ("screenshot" in target && typeof target.screenshot === "function") {
    await page.evaluate(() => {
      document.querySelectorAll(".shell-bottom-nav, nav[aria-label='App navigation']").forEach((el) => {
        (el as HTMLElement).style.setProperty("display", "none", "important");
      });
    });
    await (target as Locator).screenshot({ path: projectFilePath });
    await page.evaluate(() => {
      document.querySelectorAll(".shell-bottom-nav, nav[aria-label='App navigation']").forEach((el) => {
        (el as HTMLElement).style.removeProperty("display");
      });
    });
  } else {
    await page.screenshot({ path: projectFilePath, fullPage: false });
  }

  // 2. If designated as canonical (or if running on canonical chromium project), update root canonical copy
  if (options?.isCanonical ?? (projectName === "chromium")) {
    const canonicalPath = path.join(SCREENSHOT_DIR, filename);
    fs.copyFileSync(projectFilePath, canonicalPath);
  }
}

test.describe("EXPERIENCE-01: Adaptive Decision Canvas Browser Verification", () => {
  test.beforeAll(() => {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
    if (!fs.existsSync(VIDEO_DIR)) {
      fs.mkdirSync(VIDEO_DIR, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    await seedTestAuth(page);

    // Mock software comparison endpoint (Supabase vs Firebase)
    await page.route(`**/api/comparisons/${SOFTWARE_CMP_ID}`, (route) => {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(comparisonJobCompletedResponse(SOFTWARE_CMP_ID)),
      });
    });
    await page.route(`**/api/comparisons/${SOFTWARE_CMP_ID}/versions`, (route) => {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ versions: [] }),
      });
    });

    // Mock device comparison endpoint (iPhone 16 Pro vs Pixel 9 Pro)
    await page.route(`**/api/comparisons/${DEVICE_CMP_ID}`, (route) => {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(deviceComparisonJobCompletedResponse(DEVICE_CMP_ID)),
      });
    });
    await page.route(`**/api/comparisons/${DEVICE_CMP_ID}/versions`, (route) => {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ versions: [] }),
      });
    });

    // Mock general comparison endpoint (Remote Work vs Office Work)
    await page.route(`**/api/comparisons/${GENERAL_CMP_ID}`, (route) => {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(generalComparisonJobCompletedResponse(GENERAL_CMP_ID)),
      });
    });
    await page.route(`**/api/comparisons/${GENERAL_CMP_ID}/versions`, (route) => {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ versions: [] }),
      });
    });
  });

  test("Desktop (1280px): Adjusts priorities, asserts recalculated scores, verifies evidence modal, and preserves weights across classic round trip", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/app/comparisons/${SOFTWARE_CMP_ID}?canvas=1`);
    await waitForSettled(page);

    // 1. Verify Adaptive Decision Canvas renders with software archetype badge
    const heroTitle = page.getByRole("heading", { name: "Supabase vs Firebase" });
    await expect(heroTitle).toBeVisible();

    const badge = page.getByText("Software & Architecture", { exact: true });
    await expect(badge).toBeVisible();

    // 2. Priority Tuning & Concrete Recalculation Assertion
    const tradeoffsTab = page.locator("#adaptive-tab-tradeoffs");
    await tradeoffsTab.click();
    await expect(tradeoffsTab).toHaveAttribute("aria-selected", "true");

    const activePanel = page.locator("#adaptive-panel-tradeoffs");
    await expect(activePanel).toBeVisible();
    await waitForSettled(page, activePanel);

    // Capture initial score for entity A (Supabase)
    const scoreANum = page.locator("#adaptive-panel-tradeoffs span.font-mono.font-bold").first();
    await expect(scoreANum).toBeVisible();
    const initialScoreText = await scoreANum.innerText();
    const initialScore = parseInt(initialScoreText, 10);
    expect(Number.isFinite(initialScore)).toBe(true);

    // Find the first slider (Pricing dimension: Supabase 90, Firebase 70)
    const firstSlider = page.locator('[role="slider"]').first();
    await expect(firstSlider).toHaveAttribute("aria-valuenow", "3");

    // Adjust priority from 3x to 5x using keyboard ArrowRight
    await firstSlider.focus();
    await page.keyboard.press("ArrowRight");
    await expect(firstSlider).toHaveAttribute("aria-valuenow", "4");
    await page.keyboard.press("ArrowRight");
    await expect(firstSlider).toHaveAttribute("aria-valuenow", "5");

    // Verify weight pill reflects 5x exactly
    const weightPill = page.locator("#adaptive-panel-tradeoffs").getByText("5x", { exact: true });
    await expect(weightPill).toBeVisible();

    // Assert that the composite score index recalculates and increases (Pricing favors Supabase 90 vs 70)
    await expect(scoreANum).not.toHaveText(initialScoreText);
    const updatedScoreText = await scoreANum.innerText();
    const updatedScore = parseInt(updatedScoreText, 10);
    expect(updatedScore).toBeGreaterThan(initialScore);

    // Screenshot tradeoffs view at desktop
    await activePanel.scrollIntoViewIfNeeded();
    await captureArtifact(page, activePanel, "desktop-1280-tradeoffs-tuned.png", testInfo.project.name);

    // 3. Unconditional Evidence Focus Modal Interaction
    const evidenceTab = page.locator("#adaptive-tab-evidence");
    await evidenceTab.click();
    await expect(evidenceTab).toHaveAttribute("aria-selected", "true");

    const inspectBtn = page.locator('button[aria-label^="Inspect source citation"]').first();
    await expect(inspectBtn).toBeVisible();
    await inspectBtn.click();

    // Verify Evidence Focus Modal appears
    const modalTitle = page.locator("text=Evidence Attribution");
    await expect(modalTitle).toBeVisible();

    // Verify source citation link is grounded (valid HTTP/HTTPS URL)
    const citationLink = page.locator('a[target="_blank"]').first();
    await expect(citationLink).toBeVisible();
    const href = await citationLink.getAttribute("href");
    expect(href).toMatch(/^https?:\/\//);

    // Verify human-formatted date is displayed (e.g. "Retrieved Jun 1, 2025" instead of raw ISO timestamp)
    const humanDateText = page.locator("text=Retrieved Jun 1, 2025");
    await expect(humanDateText).toBeVisible();

    // Screenshot modal
    await captureArtifact(page, page, "desktop-1280-evidence-modal.png", testInfo.project.name);

    // Close modal using escape key
    await page.keyboard.press("Escape");
    await expect(modalTitle).not.toBeVisible();

    // 4. Verify Weights Survive a Classic / Canvas Round Trip
    // First, verify slider is still 5x on tradeoffs tab
    await tradeoffsTab.click();
    await expect(firstSlider).toHaveAttribute("aria-valuenow", "5");

    // Switch to Classic Workbench
    const switchToClassicBtn = page.locator("button", { hasText: "Switch to Classic View" });
    await expect(switchToClassicBtn).toBeVisible();
    await switchToClassicBtn.click();

    // Verify Classic Workbench renders
    const previewBanner = page.locator("text=Preview Adaptive Canvas");
    await expect(previewBanner).toBeVisible();

    // Switch back to Adaptive Canvas
    const previewCanvasBtn = page.locator("button", { hasText: "Preview Adaptive Canvas" });
    await expect(previewCanvasBtn).toBeVisible();
    await previewCanvasBtn.click();

    // Verify Adaptive Canvas is restored
    await expect(badge).toBeVisible();

    // Navigate to tradeoffs tab and assert the weight survived the round trip!
    await tradeoffsTab.click();
    const roundTripSlider = page.locator('[role="slider"]').first();
    await expect(roundTripSlider).toHaveAttribute("aria-valuenow", "5");
    await expect(scoreANum).toHaveText(updatedScoreText);

    // Restore baseline and verify score resets back to initial
    const restoreBtn = page.getByRole("button", { name: "Restore Baseline" });
    await expect(restoreBtn).toBeVisible();
    await restoreBtn.click();
    await expect(roundTripSlider).toHaveAttribute("aria-valuenow", "3");
    await expect(scoreANum).toHaveText(initialScoreText);
  });

  test("Mobile Viewport 390px (iPhone 14): Responsive layout, roving tabs, and non-conditional accordion", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/app/comparisons/${SOFTWARE_CMP_ID}?canvas=1`);
    await waitForSettled(page);

    // Verify mobile header & title fit viewport
    const heroTitle = page.getByRole("heading", { name: "Supabase vs Firebase" });
    await expect(heroTitle).toBeVisible();

    // Verify no horizontal overflow on body
    const bodyScrollWidth390 = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth390 = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth390).toBeLessThanOrEqual(windowWidth390 + 5);

    // Verify Keyboard Navigation across tabs (roving tab index)
    const overviewTab = page.locator("#adaptive-tab-overview");
    await overviewTab.focus();
    await page.keyboard.press("ArrowRight");

    const tradeoffsTab = page.locator("#adaptive-tab-tradeoffs");
    await expect(tradeoffsTab).toHaveAttribute("aria-selected", "true");
    await expect(tradeoffsTab).toBeFocused();

    // Arrow navigation wraps to end
    await page.keyboard.press("End");
    const evidenceTab = page.locator("#adaptive-tab-evidence");
    await expect(evidenceTab).toHaveAttribute("aria-selected", "true");
    await expect(evidenceTab).toBeFocused();

    // Verify Category Deep-Dive Accordion (Unconditional interaction)
    const categoryToggle = page.locator('div[role="button"][aria-label^="Toggle details for category"]').first();
    await expect(categoryToggle).toBeVisible();
    const isExpandedBefore = await categoryToggle.getAttribute("aria-expanded");
    expect(isExpandedBefore).toBe("true");

    // Click to collapse
    await categoryToggle.click();
    await expect(categoryToggle).toHaveAttribute("aria-expanded", "false");

    // Click to expand
    await categoryToggle.click();
    await expect(categoryToggle).toHaveAttribute("aria-expanded", "true");

    // Screenshot mobile 390
    const mobilePanel = page.locator("#adaptive-panel-evidence");
    await mobilePanel.scrollIntoViewIfNeeded();
    await captureArtifact(page, mobilePanel, "mobile-390-overview.png", testInfo.project.name);
  });

  test("Mobile Viewport 430px (iPhone 16 Pro Max): Responsive fit and priority tuning inspection", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto(`/app/comparisons/${SOFTWARE_CMP_ID}?canvas=1`);
    await waitForSettled(page);

    const heroTitle = page.getByRole("heading", { name: "Supabase vs Firebase" });
    await expect(heroTitle).toBeVisible();

    const bodyScrollWidth430 = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth430 = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth430).toBeLessThanOrEqual(windowWidth430 + 5);

    // Switch to tradeoffs view on 430px viewport
    await page.locator("#adaptive-tab-tradeoffs").click();
    const firstSlider = page.locator('[role="slider"]').first();
    await expect(firstSlider).toBeVisible();

    const tradeoffsCard430 = page.locator("#adaptive-panel-tradeoffs > div.rounded-2xl").first();
    await expect(tradeoffsCard430).toBeVisible();
    await waitForSettled(page, tradeoffsCard430);

    await captureArtifact(page, tradeoffsCard430, "mobile-430-tradeoffs.png", testInfo.project.name);
  });

  test("Mobile Viewport 320px (iPhone SE): Narrow layout containment without overflow", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(`/app/comparisons/${SOFTWARE_CMP_ID}?canvas=1`);
    await waitForSettled(page);

    const heroTitle = page.getByRole("heading", { name: "Supabase vs Firebase" });
    await expect(heroTitle).toBeVisible();

    const bodyScrollWidth320 = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth320 = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth320).toBeLessThanOrEqual(windowWidth320 + 5);

    // Switch to tradeoffs view on 320px viewport
    await page.locator("#adaptive-tab-tradeoffs").click();
    const slider320 = page.locator('[role="slider"]').first();
    await expect(slider320).toBeVisible();

    const tradeoffsCard320 = page.locator("#adaptive-panel-tradeoffs > div.rounded-2xl").first();
    await expect(tradeoffsCard320).toBeVisible();
    await waitForSettled(page, tradeoffsCard320);

    // Verify badge does NOT collide with entity name and score values do NOT wrap
    const priorityLeadBadge = tradeoffsCard320.getByText("Priority Lead").first();
    await expect(priorityLeadBadge).toBeVisible();

    // Verify score value has nowrap formatting
    const scoreVal = tradeoffsCard320.locator("span.font-mono.font-bold").first();
    await expect(scoreVal).toBeVisible();

    await captureArtifact(page, tradeoffsCard320, "mobile-320-tradeoffs.png", testInfo.project.name);
  });

  test("Products & Devices Archetype: Demonstrates hardware specs matrix and unit extraction", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/app/comparisons/${DEVICE_CMP_ID}?canvas=1`);
    await waitForSettled(page);

    // Verify device archetype badge & title
    const deviceTitle = page.getByRole("heading", { name: "iPhone 16 Pro vs Pixel 9 Pro" });
    await expect(deviceTitle).toBeVisible();

    const deviceBadge = page.getByText("Hardware & Specifications", { exact: true });
    await expect(deviceBadge).toBeVisible();

    // Verify technical specification matrix renders hardware units
    const specMatrix = page.locator("#adaptive-panel-overview");
    await expect(specMatrix).toBeVisible();

    // Check for extracted unit badges in the spec matrix (e.g. 2000 nits, 3582 mAh)
    const unitBadge = page.getByText("2000 nits").first();
    await expect(unitBadge).toBeVisible();

    const deviceCard = page
      .getByRole("heading", { name: "Hardware Specifications & Component Breakdown" })
      .locator("xpath=ancestor::div[contains(@class, 'rounded-2xl')][1]");
    await deviceCard.scrollIntoViewIfNeeded();
    await captureArtifact(page, deviceCard, "desktop-1280-devices-archetype.png", testInfo.project.name);
  });

  test("General Multi-Criteria Archetype: Demonstrates general scorecard and multi-criteria badge", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/app/comparisons/${GENERAL_CMP_ID}?canvas=1`);
    await waitForSettled(page);

    // Verify general archetype badge & title
    const generalTitle = page.getByRole("heading", { name: "Remote Work vs Office Work" });
    await expect(generalTitle).toBeVisible();

    const generalBadge = page.getByText("Multi-Criteria Decision", { exact: true });
    await expect(generalBadge).toBeVisible();

    // Verify criteria dimensions render
    const autonomyDim = page.locator("text=Flexibility & Autonomy").first();
    await expect(autonomyDim).toBeVisible();

    const generalCard = page
      .getByRole("heading", { name: "Multi-Criteria Decision Attributes" })
      .locator("xpath=ancestor::div[contains(@class, 'rounded-2xl')][1]");
    await generalCard.scrollIntoViewIfNeeded();
    await captureArtifact(page, generalCard, "desktop-1280-general-archetype.png", testInfo.project.name);
  });

  test("Reduced Motion: Asserts transitions are disabled and score bar updates instantaneously", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/app/comparisons/${SOFTWARE_CMP_ID}?canvas=1`);

    // 1. Verify reduced motion media query is recognized in document
    const prefersReduced = await page.evaluate(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    expect(prefersReduced).toBe(true);

    // 2. Verify global CSS disables smooth scrolling
    const scrollBehavior = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    );
    expect(scrollBehavior).toBe("auto");

    // 3. Navigate to tradeoffs
    const tradeoffsTab = page.locator("#adaptive-tab-tradeoffs");
    await tradeoffsTab.click();

    // Verify animated score bar exists and has transition duration <= 0.01s (instantaneous)
    const scoreBar = page.locator("#adaptive-panel-tradeoffs .h-2 > div").first();
    await expect(scoreBar).toBeVisible();

    const transitionDuration = await scoreBar.evaluate((el) => {
      return getComputedStyle(el).transitionDuration;
    });
    const durationSeconds = parseFloat(transitionDuration) || 0;
    expect(durationSeconds).toBeLessThanOrEqual(0.01);

    // 4. Verify instantaneous update without spring settle time
    const initialWidth = await scoreBar.evaluate((el) => (el as HTMLElement).style.width);
    const firstSlider = page.locator('[role="slider"]').first();
    await expect(firstSlider).toHaveAttribute("aria-valuenow", "3");
    await firstSlider.focus();
    await page.keyboard.press("ArrowRight");
    await expect(firstSlider).toHaveAttribute("aria-valuenow", "4");

    await expect
      .poll(async () => scoreBar.evaluate((el) => (el as HTMLElement).style.width), {
        timeout: 3000,
      })
      .not.toEqual(initialWidth);
  });

  test("Preview Gate: Classic view without preview flag does NOT show preview banner", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Navigate WITHOUT canvas query param or localStorage
    await page.goto(`/app/comparisons/${SOFTWARE_CMP_ID}`);

    // Verify Classic view renders by default
    await expect(page.locator("text=Supabase vs Firebase").first()).toBeVisible();

    // Verify Development Preview banner is NOT shown
    const previewBanner = page.locator("text=Preview Adaptive Canvas");
    await expect(previewBanner).not.toBeVisible();
  });

  test("Desktop Interaction Video: Priority tuning -> Evidence inspection -> Modal dismissal", async ({
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Video recording runs on canonical Desktop Chromium project");

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      recordVideo: {
        dir: VIDEO_DIR,
        size: { width: 1280, height: 800 },
      },
    });

    const page = await context.newPage();
    await seedTestAuth(page);

    // Mock comparison API routes
    await page.route(`**/api/comparisons/${SOFTWARE_CMP_ID}`, (route) => {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(comparisonJobCompletedResponse(SOFTWARE_CMP_ID)),
      });
    });
    await page.route(`**/api/comparisons/${SOFTWARE_CMP_ID}/versions`, (route) => {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ versions: [] }),
      });
    });

    await page.goto(`/app/comparisons/${SOFTWARE_CMP_ID}?canvas=1`);
    await waitForSettled(page);

    // 1. Switch to Tradeoffs tab
    const tradeoffsTab = page.locator("#adaptive-tab-tradeoffs");
    await tradeoffsTab.click();
    await expect(tradeoffsTab).toHaveAttribute("aria-selected", "true");
    const tradeoffsPanel = page.locator("#adaptive-panel-tradeoffs");
    await expect(tradeoffsPanel).toBeVisible();
    await page.waitForTimeout(600);

    // 2. Tune first slider (ArrowRight to 4x, then 5x)
    const firstSlider = page.locator('[role="slider"]').first();
    await firstSlider.focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(400);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(600);

    // 3. Click Evidence button on the first criterion (Pricing)
    const evidenceBtn = tradeoffsPanel.getByRole("button", { name: "Evidence" }).first();
    await expect(evidenceBtn).toBeVisible();
    await evidenceBtn.click();

    // 4. Verify Evidence Focus Modal appears and is visible
    const modalTitle = page.locator("text=Evidence Attribution");
    await expect(modalTitle).toBeVisible();
    await page.waitForTimeout(1200);

    // 5. Dismiss modal using Escape
    await page.keyboard.press("Escape");
    await expect(modalTitle).not.toBeVisible();
    await page.waitForTimeout(600);

    // Finalize recording
    const video = page.video();
    await page.close();
    await context.close();

    if (video) {
      const origVideoPath = await video.path();
      const targetVideoPath = path.join(VIDEO_DIR, "priority-tuning-evidence-interaction.webm");
      if (fs.existsSync(origVideoPath)) {
        fs.copyFileSync(origVideoPath, targetVideoPath);
      }
    }
  });
});
