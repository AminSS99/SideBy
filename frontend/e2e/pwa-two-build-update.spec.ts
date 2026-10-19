import { test, expect } from "@playwright/test";
import { execFile, spawn, type ChildProcess } from "node:child_process";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { createServer } from "node:net";

/**
 * Real two-build service-worker update with unsaved input.
 *
 * Unlike unit-level store tests, this exercises the genuine browser update
 * lifecycle: build A is served and controlled, the composer holds dirty
 * input, build B (different bytes via a build-id meta marker) is produced
 * into the same output directory, a plain navigation triggers the browser's
 * own update check, the waiting worker fires the real update prompt, and the
 * user-initiated update activates build B and restores the draft.
 *
 * Nothing is simulated: no route interception of sw.js, no manual
 * notifyNeedRefresh, and no test-driven reload standing in for activation.
 * The update check runs via registration.update() without navigating so the
 * dirty composer survives — the same check the browser runs on navigation.
 * The proof that build B runs is the build-B marker in the live DOM.
 *
 * Desktop-Chromium-only (enforced via testIgnore in playwright.config.ts)
 * and serial: rebuilding the served artifact mid-suite cannot run in
 * parallel with other specs.
 */
test.describe.configure({ mode: "serial", timeout: 300_000 });

const OUT_DIR = "dist/two-build";
const MARKER_NAME = "pwa-build-id";

let server: ChildProcess | null = null;
let serverStderr = "";
let BASE = "";

/** A free port per run: never collides with stale servers or parallel runs. */
function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      probe.close(() => {
        if (address && typeof address === "object") {
          resolve(address.port);
        } else {
          reject(new Error("could not determine a free port"));
        }
      });
    });
  });
}

function runBuild(): Promise<void> {
  const env = { ...process.env };
  // Registration and draft paths are identical either way; build without test
  // auth so this verifies the true production artifact.
  delete env.VITE_ENABLE_TEST_AUTH;
  return new Promise((resolve, reject) => {
    execFile(
      "pnpm",
      ["exec", "vite", "build", "--outDir", OUT_DIR, "--emptyOutDir"],
      { cwd: process.cwd(), env, timeout: 240_000 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`vite build failed: ${stderr || stdout}`));
        } else {
          resolve();
        }
      },
    );
  });
}

/** Builds with a unique marker meta tag; index.html is always restored. */
async function buildWithMarker(marker: string): Promise<void> {
  const indexPath = "index.html";
  const original = readFileSync(indexPath, "utf8");
  // Idempotent: strip any leftover marker first so a previously interrupted
  // run can never poison this build.
  const clean = original
    .split("\n")
    .filter((line) => !line.includes(MARKER_NAME))
    .join("\n");
  const marked = clean.replace(
    '<meta charset="UTF-8" />',
    `<meta charset="UTF-8" />\n    <meta name="${MARKER_NAME}" content="${marker}" />`,
  );
  if (marked === clean) {
    throw new Error("could not inject build marker into index.html");
  }
  writeFileSync(indexPath, marked);
  try {
    await runBuild();
  } finally {
    writeFileSync(indexPath, clean);
  }
}

async function waitForServer(): Promise<void> {
  // Generous under full-suite load, when two production builds and three
  // browser projects compete for the same machine.
  const deadline = Date.now() + 180_000;
  for (;;) {
    if (server?.exitCode !== null && server?.exitCode !== undefined) {
      throw new Error(
        `preview server exited before becoming ready (code ${server.exitCode}): ${serverStderr.slice(-2000)}`,
      );
    }
    try {
      const response = await fetch(`${BASE}/`);
      if (response.ok) return;
    } catch {
      // Not up yet.
    }
    if (Date.now() > deadline) {
      throw new Error(
        `preview server at ${BASE} did not start in time. Recent stderr: ${serverStderr.slice(-2000)}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

function killServerTree(): void {
  if (!server) return;
  // Kill the whole process group: plain kill() can orphan the vite child
  // behind pnpm and squat the port for the next run.
  if (server.pid !== undefined) {
    try {
      process.kill(-server.pid, "SIGTERM");
      server = null;
      return;
    } catch {
      // Fall through to a direct kill.
    }
  }
  server.kill("SIGTERM");
  server = null;
}

test.beforeAll(async () => {
  // A cold production build plus server startup exceeds the default 30s hook
  // budget under parallel-suite load.
  test.setTimeout(300_000);
  const port = await findFreePort();
  BASE = `http://localhost:${port}`;
  await buildWithMarker("build-a");
  server = spawn(
    "pnpm",
    ["exec", "vite", "preview", "--outDir", OUT_DIR, "--port", String(port), "--strictPort"],
    { cwd: process.cwd(), stdio: ["ignore", "ignore", "pipe"], detached: process.platform !== "win32" },
  );
  server.stderr?.on("data", (chunk: Buffer) => {
    serverStderr = `${serverStderr}${chunk.toString()}`.slice(-4000);
  });
  await waitForServer();
});

test.afterAll(async () => {
  killServerTree();
  // Belt and braces: the per-build finally restores index.html, but never
  // leave a marker behind if something went wrong above.
  const indexPath = "index.html";
  const content = readFileSync(indexPath, "utf8");
  if (content.includes(MARKER_NAME)) {
    writeFileSync(
      indexPath,
      content
        .split("\n")
        .filter((line) => !line.includes(MARKER_NAME))
        .join("\n"),
    );
  }
  rmSync(OUT_DIR, { recursive: true, force: true });
});

test("real two-build update preserves unsaved input and activates the new build", async ({
  page,
}) => {

  // Navigation-tolerant: the activation reload destroys the execution
  // context mid-poll, which must read as "not yet" rather than failure.
  const buildId = (): Promise<string | null> =>
    page
      .evaluate(
        (name) => document.querySelector(`meta[name="${name}"]`)?.getAttribute("content"),
        MARKER_NAME,
      )
      .catch(() => "navigating");

  // 1. Load build A and confirm it is worker-controlled.
  await page.goto(`${BASE}/`);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30_000 });
  await expect(page.getByLabel("First option")).toBeVisible();
  expect(await buildId()).toBe("build-a");

  // 2. Type unsaved input and confirm real dirty state (store seam, not a simulation).
  await page.getByLabel("First option").fill("Next.js App Router");
  await page.getByLabel("Second option").fill("Remix Vite");
  const isDirty = await page.evaluate(() => {
    const store = (window as unknown as { __pwaUpdates?: { isDirty: () => boolean } }).__pwaUpdates;
    return store?.isDirty() ?? false;
  });
  expect(isDirty).toBe(true);

  // 3. Deploy build B (different bytes) while the page stays open.
  //    A reload here would wipe the dirty composer state, so the update check
  //    below runs without navigating — exactly the check the browser performs
  //    on navigation and workbox performs on its update cycle.
  await buildWithMarker("build-b");

  // 4. Run the browser's real worker update check against the deployed build
  //    B. No fallback follows: the prompt must come from the genuine waiting
  //    worker, or this test fails.
  await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.update()));
  });
  const prompt = page.locator('div[role="alert"]:has-text("New version available")');
  await expect(prompt).toBeVisible({ timeout: 90_000 });

  // 5. Dirty-aware prompt copy and action, then user-initiated activation.
  await expect(prompt).toContainText(
    "You have unsaved input. SideBy will preserve your draft and restore it automatically after reloading.",
  );
  await prompt.getByRole("button", { name: "Save draft & update" }).click();

  // 6. Activation reloads into build B: prove it via the live DOM marker
  //    (not via any test-triggered reload), plus draft restoration.
  await expect.poll(async () => buildId(), { timeout: 60_000 }).toBe("build-b");
  await expect(page.getByLabel("First option")).toHaveValue("Next.js App Router");
  await expect(page.getByLabel("Second option")).toHaveValue("Remix Vite");
  await expect(page.getByText("Restored your unsaved comparison draft.")).toBeVisible();
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
});
