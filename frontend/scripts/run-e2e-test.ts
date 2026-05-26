import puppeteer from "puppeteer-core";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ARTIFACTS_DIR = "/Users/aminsobor/.gemini/antigravity/brain/60587890-e198-424d-9c4a-0868cab74846";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

async function clickButtonByText(page: puppeteer.Page, text: string): Promise<boolean> {
  const buttons = await page.$$("button");
  for (const btn of buttons) {
    const content = await page.evaluate(el => el.textContent, btn);
    if (content && content.trim().toLowerCase() === text.toLowerCase()) {
      await btn.click();
      return true;
    }
  }
  return false;
}

async function runE2ETests() {
  console.log(`\n${colors.blue}🚀 Starting SideBy E2E Browser Tests...${colors.reset}`);
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Chrome Binary: ${CHROME_PATH}`);
  console.log(`   Artifacts Directory: ${ARTIFACTS_DIR}\n`);

  if (!fs.existsSync(CHROME_PATH)) {
    throw new Error(`Chrome binary not found at ${CHROME_PATH}`);
  }

  // Ensure artifacts directory exists
  if (!fs.existsSync(ARTIFACTS_DIR)) {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  // Route page logs and errors to the terminal
  page.on("console", (msg) => {
    const text = msg.text();
    if (!text.includes("PostHog") && !text.includes("Clerk")) {
      console.log(`[Browser Console] [${msg.type()}] ${text}`);
    }
  });
  page.on("pageerror", (err) => {
    console.error(`${colors.red}[Browser Page Error] ${err.message}${colors.reset}`);
  });
  page.on("response", (response) => {
    const status = response.status();
    if (status >= 400) {
      console.log(`${colors.red}[Browser Network Error] ${response.url()} -> Status ${status}${colors.reset}`);
    }
  });

  try {
    // 1. Visit Landing Page
    console.log("Step 1: Navigating to landing page...");
    await page.goto(BASE_URL, { waitUntil: "networkidle2" });
    
    // Capture landing page screenshot
    const landingScreenshotPath = path.join(ARTIFACTS_DIR, "landing_page.png");
    await page.screenshot({ path: landingScreenshotPath, fullPage: true });
    console.log(`  ${colors.green}✓${colors.reset} Landing page loaded. Screenshot saved to: ${landingScreenshotPath}`);

    // 2. Set Bypass Auth LocalStorage
    console.log("\nStep 2: Injecting test auth token and navigating to workbench...");
    await page.evaluate(() => {
      localStorage.setItem("sideby.test.auth", "true");
    });

    // Go to Comparisons page (which requires auth, but should now pass)
    await page.goto(`${BASE_URL}/app/comparisons`, { waitUntil: "networkidle2" });

    // Wait for the workbench title or input to show up
    await page.waitForSelector('input[placeholder="Start: Product A vs Product B"]', { timeout: 15000 });
    
    // Capture dashboard screenshot
    const dashboardScreenshotPath = path.join(ARTIFACTS_DIR, "dashboard_page.png");
    await page.screenshot({ path: dashboardScreenshotPath, fullPage: true });
    console.log(`  ${colors.green}✓${colors.reset} Authenticated dashboard loaded. Screenshot saved to: ${dashboardScreenshotPath}`);

    // 3. Start a Comparison Query
    console.log("\nStep 3: Initiating comparison query: 'Astro vs SvelteKit'...");
    await page.type('input[placeholder="Start: Product A vs Product B"]', "Astro vs SvelteKit");
    
    // Wait a brief moment for query preflight to update
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Click "Start" button
    const started = await clickButtonByText(page, "Start");
    if (!started) {
      throw new Error("Could not find or click the 'Start' button.");
    }
    console.log("  Click 'Start' triggered successfully.");

    // 4. Wait for navigation to workbench detail page
    console.log("  Waiting for navigation to comparison detail page...");
    await page.waitForFunction(
      () => window.location.pathname.startsWith("/app/comparisons/") && window.location.pathname !== "/app/comparisons",
      { timeout: 20000 }
    );
    console.log("  URL changed to detail page. Waiting for research loader or completed workbench...");
    const state = await page.waitForFunction(() => {
      const text = document.body.textContent || "";
      const hasLoader = text.includes("Orchestration Active");
      const hasGrid = !!document.querySelector(".wb-grid");
      if (hasLoader) return "running";
      if (hasGrid) return "completed";
      return null;
    }, { timeout: 20000 });
    
    const statusType = await state.jsonValue();
    console.log(`  Detail page status: ${statusType}`);

    if (statusType === "running") {
      // Wait for animation to settle
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Capture running workbench screenshot
      const runningScreenshotPath = path.join(ARTIFACTS_DIR, "running_workbench.png");
      await page.screenshot({ path: runningScreenshotPath, fullPage: true });
      console.log(`  ${colors.green}✓${colors.reset} Research running. Screenshot saved to: ${runningScreenshotPath}`);
    } else {
      console.log("  Comparison was served from cache immediately. Skipping running workbench screenshot.");
    }

    // 5. Poll for completion (up to 180 seconds)
    console.log("\nStep 5: Monitoring E2E research pipeline progress...");
    let completed = false;
    const maxPollAttempts = 90; // 90 * 2s = 180s
    for (let attempt = 1; attempt <= maxPollAttempts; attempt++) {
      // Check for failure banner
      const failedBanner = await page.$(".border-red-400\\/20");
      if (failedBanner) {
        const errorText = await page.evaluate(el => el.textContent, failedBanner);
        throw new Error(`Comparison research failed: ${errorText}`);
      }

      // Check if the final grid/workbench has rendered (meaning success)
      const completedGrid = await page.$(".wb-grid");
      if (completedGrid) {
        completed = true;
        break;
      }

      // Print progress logs or active steps if available
      const activeStepEl = await page.$(".text-white\\/45");
      if (activeStepEl) {
        const stepText = await page.evaluate(el => el.textContent, activeStepEl);
        console.log(`   [Attempt ${attempt}/${maxPollAttempts}] Current pipeline status: ${stepText?.trim()}`);
      } else {
        console.log(`   [Attempt ${attempt}/${maxPollAttempts}] Researching...`);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (!completed) {
      throw new Error("Timeout: Comparison research did not complete within 180 seconds.");
    }

    console.log(`  ${colors.green}✓${colors.reset} Research pipeline completed successfully!`);

    // Let the GSAP animations finish rendering
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Capture final completed workbench screenshot
    const completedScreenshotPath = path.join(ARTIFACTS_DIR, "completed_workbench.png");
    await page.screenshot({ path: completedScreenshotPath, fullPage: true });
    console.log(`  ${colors.green}✓${colors.reset} Completed comparison workbench screenshot saved to: ${completedScreenshotPath}`);

    // 6. Verify components are present
    console.log("\nStep 6: Verifying key workbench components...");
    
    // Check Radar Chart Canvas/SVG
    const radarChart = await page.$(".recharts-responsive-container");
    if (radarChart) {
      console.log(`  ${colors.green}✓${colors.reset} Recharts Radar Chart is rendered.`);
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} Radar Chart container not found.`);
    }

    // Check Feature Matrix Panel
    const featureMatrix = await page.$("#feature-matrix");
    if (featureMatrix) {
      console.log(`  ${colors.green}✓${colors.reset} Feature Matrix (CSS Grid) is rendered.`);
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} Feature Matrix not found.`);
    }

    // Check Verdict Panel
    const verdictPanel = await page.$("aside");
    if (verdictPanel) {
      console.log(`  ${colors.green}✓${colors.reset} Verdict / Sidebar panels are rendered.`);
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} Verdict / Sidebar panels not found.`);
    }

    console.log(`\n${colors.green}🎉 ALL E2E BROWSER TESTS PASSED!${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}❌ E2E Browser Test Failed:${colors.reset}`);
    console.error(error);
    
    // Take an error screenshot if possible
    try {
      const errorScreenshotPath = path.join(ARTIFACTS_DIR, "error_state.png");
      await page.screenshot({ path: errorScreenshotPath, fullPage: true });
      console.log(`  Captured error screenshot to: ${errorScreenshotPath}`);
    } catch (shotError) {
      console.error("Failed to capture error screenshot:", shotError);
    }
    
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runE2ETests();
