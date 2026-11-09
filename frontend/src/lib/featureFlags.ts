/**
 * SideBy Feature Flags System
 * 
 * Provides runtime toggle controls for experimental and signature features,
 * with zero external dependencies and instant fallback to baseline behavior.
 */

const STORAGE_KEY_PREFIX = "sideby_flag_";

export type FeatureFlagKey = "adaptiveCanvas" | "keyboardSpacer" | "publicSnapshots";

const DEFAULT_FLAGS: Record<FeatureFlagKey, boolean> = {
  // Default off for general users: unverified preview feature requiring explicit opt-in
  adaptiveCanvas: false,
  keyboardSpacer: true,
  publicSnapshots: true,
};

/**
 * Check whether a feature flag is enabled.
 * Evaluation precedence:
 * 1. URL search parameter (e.g. `?flag_adaptiveCanvas=1` or `?canvas=0`)
 * 2. Window / localStorage override (if in browser)
 * 3. Environment variable (e.g. `VITE_FEATURE_ADAPTIVE_CANVAS`)
 * 4. Safe default (true for tested release candidates)
 */
export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  if (typeof window !== "undefined") {
    try {
      // 1. URL search param check
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get(`flag_${flag}`);
      if (urlParam === "1" || urlParam === "true") return true;
      if (urlParam === "0" || urlParam === "false") return false;

      // Special alias for adaptive canvas
      if (flag === "adaptiveCanvas") {
        const canvasParam = params.get("canvas");
        if (canvasParam === "1" || canvasParam === "true" || canvasParam === "preview") return true;
        if (canvasParam === "0" || canvasParam === "false") return false;

        const previewParam = params.get("preview");
        if (previewParam === "canvas" || previewParam === "adaptive") return true;
      }

      // 2. Local storage check
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${flag}`);
      if (stored === "true") return true;
      if (stored === "false") return false;
    } catch {
      // Ignore storage errors (private browsing or security exceptions)
    }
  }

  // 3. Vite env var check
  try {
    const envVarName = `VITE_FEATURE_${flag.replace(/([A-Z])/g, "_$1").toUpperCase()}`;
    // Access Vite's import.meta.env safely
    const envVal = (import.meta as unknown as { env?: Record<string, string> }).env?.[envVarName];
    if (envVal === "false" || envVal === "0") return false;
    if (envVal === "true" || envVal === "1") return true;
  } catch {
    // Ignore environment lookup errors
  }

  // 4. Default fallback
  return DEFAULT_FLAGS[flag] ?? false;
}

/**
 * Convenience helper specifically for Adaptive Decision Canvas.
 */
export function isAdaptiveCanvasEnabled(): boolean {
  return isFeatureEnabled("adaptiveCanvas");
}

/**
 * Check whether the user has explicitly opted into the Adaptive Canvas preview.
 * This strictly gates development preview banners and switch affordances so regular
 * classic-view users never see unverified development-preview controls unless they
 * provide an explicit preview trigger (?preview=canvas, ?canvas=1, ?canvas=preview, or localStorage override).
 */
export function hasAdaptiveCanvasPreviewOptIn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const canvasParam = params.get("canvas");
    const previewParam = params.get("preview");
    const flagParam = params.get("flag_adaptiveCanvas");

    if (canvasParam === "1" || canvasParam === "true" || canvasParam === "preview") return true;
    if (previewParam === "canvas" || previewParam === "adaptive") return true;
    if (flagParam === "1" || flagParam === "true") return true;

    return localStorage.getItem(`${STORAGE_KEY_PREFIX}adaptiveCanvas`) === "true";
  } catch {
    return false;
  }
}

/**
 * Set a local override for testing or manual user preference.
 */
export function setFeatureFlagOverride(flag: FeatureFlagKey, enabled: boolean | null): void {
  if (typeof window === "undefined") return;
  try {
    if (enabled === null) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${flag}`);
    } else {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${flag}`, enabled ? "true" : "false");
    }
  } catch {
    // Ignore storage errors
  }
}
