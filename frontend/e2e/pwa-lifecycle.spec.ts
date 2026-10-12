import { test, expect } from "@playwright/test";

/**
 * Production worker lifecycle against the real built artifact.
 *
 * These run in fresh browser profiles per test, so every registration starts
 * clean. This suite covers registration, control, offline shell, API
 * network-only behavior, and scope-gated draft restoration. The genuine
 * two-build update (real second build activating with unsaved input) lives
 * in ./pwa-two-build-update.spec.ts, which owns its builds and server.
 */
test.describe("SideBy production worker lifecycle", () => {
  test("registers the worker for the app scope and is controlled after reload", async ({ page }) => {
    await page.goto("/");

    const registration = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      if (reg.active && reg.active.state !== "activated") {
        await new Promise<void>((resolve) => {
          const worker = reg.active!;
          const onStateChange = () => {
            if (worker.state === "activated") {
              worker.removeEventListener("statechange", onStateChange);
              resolve();
            }
          };
          worker.addEventListener("statechange", onStateChange);
          if (worker.state === "activated") {
            worker.removeEventListener("statechange", onStateChange);
            resolve();
          }
        });
      }
      return {
        scope: reg.scope,
        scriptURL: reg.active?.scriptURL ?? null,
        state: reg.active?.state ?? null,
      };
    });
    expect(registration.scope).toBe(new URL("/", page.url()).toString());
    expect(registration.scriptURL).toContain("/sw.js");
    expect(registration.state).toBe("activated");

    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 20000 });
    expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    // The bundle must not retain the unresolved virtual registration import.
    const virtualImportErrors: string[] = [];
    page.on("pageerror", (error) => {
      if (/virtual:pwa-register/.test(error.message)) virtualImportErrors.push(error.message);
    });
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 20000 });
    expect(virtualImportErrors).toEqual([]);
  });

  test("serves the shell offline while API routes stay network-only", async ({ page, context, browserName }) => {
    test.skip(
      browserName === "webkit",
      "Playwright WebKit has a known internal error during context.setOffline reload with service workers",
    );

    await page.goto("/");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });

    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 20000 });

    await context.setOffline(true);
    try {
      await page.reload({ waitUntil: "load" });
      await expect(page.locator("#root")).toBeAttached();
      await expect(page.getByLabel("First option")).toBeVisible({ timeout: 15000 });

      const apiOutcome = await page.evaluate(async () => {
        try {
          const response = await fetch("/api/comparisons");
          const body = await response.text();
          return `responded:${response.status}:${body.slice(0, 15)}`;
        } catch {
          return "rejected";
        }
      });
      // NetworkOnly: the offline worker must reject API calls, never answer
      // them with the cached SPA shell.
      expect(apiOutcome).toBe("rejected");
    } finally {
      await context.setOffline(false);
    }
  });

  test("restores a scope-matched draft in the real composer after reload", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByLabel("First option")).toBeVisible();

    await page.evaluate(() => {
      const envelope = {
        version: 1,
        createdAt: Date.now(),
        kind: "composer",
        scope: { userId: null, workspaceId: null, anonymous: true },
        data: { entityA: "Supabase", entityB: "Firebase", context: "a production BaaS" },
      };
      window.sessionStorage.setItem("sideby_preserved_drafts_v1", JSON.stringify({ composer: envelope }));
    });

    await page.reload();
    await expect(page.getByLabel("First option")).toHaveValue("Supabase");
    await expect(page.getByLabel("Second option")).toHaveValue("Firebase");
    await expect(page.getByText("Restored your unsaved comparison draft.")).toBeVisible();
  });

  test("ignores drafts scoped to another account and discards legacy records", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByLabel("First option")).toBeVisible();

    await page.evaluate(() => {
      const foreign = {
        version: 1,
        createdAt: Date.now(),
        kind: "composer",
        scope: { userId: "user_someone_else", workspaceId: null, anonymous: false },
        data: { entityA: "Leaked", entityB: "Leaked" },
      };
      window.sessionStorage.setItem("sideby_preserved_drafts_v1", JSON.stringify({ composer: foreign }));
    });

    await page.reload();
    await expect(page.getByLabel("First option")).toHaveValue("");
    await expect(page.getByText("Restored your unsaved comparison draft.")).toHaveCount(0);

    // Legacy unscoped records cannot prove ownership: discarded, never restored.
    await page.evaluate(() => {
      window.sessionStorage.setItem(
        "sideby_preserved_drafts_v1",
        JSON.stringify({ composer: { entityA: "Legacy", entityB: "Legacy" } }),
      );
    });
    await page.reload();
    await expect(page.getByLabel("First option")).toHaveValue("");
    await expect(page.getByText("Restored your unsaved comparison draft.")).toHaveCount(0);
  });

});
