/**
 * Guarded browser storage + reload primitives.
 *
 * sessionStorage property access itself can throw (blocked third-party
 * storage, Safari private mode, disabled cookies), so every touchpoint is
 * wrapped. Writers report success so callers can distinguish "persisted"
 * from "silently dropped" — critical for reload guards, where a dropped
 * write must disable automatic recovery instead of permitting a repeat loop.
 */

/** Guard key recording that chunk-mismatch auto-recovery already reloaded once. */
export const CHUNK_RELOAD_GUARD_KEY = "sideby_chunk_reload_attempted";

export function safeSessionGet(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function safeSessionSet(key: string, value: string): boolean {
  try {
    if (typeof window === "undefined") return false;
    window.sessionStorage?.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeSessionRemove(key: string): void {
  try {
    if (typeof window !== "undefined") {
      window.sessionStorage?.removeItem(key);
    }
  } catch {
    // Storage access blocked; safe fallback.
  }
}

/** Separated for testability: unit/component tests observe this boundary. */
export function reloadPage(): void {
  window.location.reload();
}

/**
 * Resolves once a *different* service worker takes control of this page
 * (the handoff workbox performs after skipWaiting + activate + claim), or
 * rejects after timeoutMs. Resolves immediately where service workers are
 * unsupported so unit tests and non-PWA contexts never hang here.
 */
export function waitForNewController(timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      resolve();
      return;
    }
    const previous = navigator.serviceWorker.controller;
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("timed out waiting for the updated worker to take control"));
    }, timeoutMs);
    const onChange = () => {
      const current = navigator.serviceWorker.controller;
      if (current && current !== previous) {
        cleanup();
        resolve();
      }
    };
    const cleanup = () => {
      window.clearTimeout(timer);
      navigator.serviceWorker.removeEventListener("controllerchange", onChange);
    };
    navigator.serviceWorker.addEventListener("controllerchange", onChange);
  });
}
