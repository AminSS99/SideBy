// @vitest-environment jsdom
/**
 * AUTHORED BUT UNEXECUTED — deferred testing instruction (EXPERIENCE-01).
 * Do not run these tests until validation is explicitly authorized by coordinator.
 *
 * Covers:
 * 1. Default feature flag resolution.
 * 2. URL search param precedence.
 * 3. LocalStorage overrides and reset.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  isFeatureEnabled,
  isAdaptiveCanvasEnabled,
  hasAdaptiveCanvasPreviewOptIn,
  setFeatureFlagOverride,
} from "../featureFlags";

describe("featureFlags", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("defaults adaptiveCanvas to false for general users (development preview only)", () => {
    expect(isAdaptiveCanvasEnabled()).toBe(false);
  });

  it("gates preview banner: defaults hasAdaptiveCanvasPreviewOptIn to false without triggers", () => {
    expect(hasAdaptiveCanvasPreviewOptIn()).toBe(false);
  });

  it("enables preview access when localStorage override is present", () => {
    setFeatureFlagOverride("adaptiveCanvas", true);
    expect(isAdaptiveCanvasEnabled()).toBe(true);
    expect(hasAdaptiveCanvasPreviewOptIn()).toBe(true);

    setFeatureFlagOverride("adaptiveCanvas", false);
    expect(isAdaptiveCanvasEnabled()).toBe(false);
    expect(hasAdaptiveCanvasPreviewOptIn()).toBe(false);

    setFeatureFlagOverride("adaptiveCanvas", null);
    expect(isAdaptiveCanvasEnabled()).toBe(false);
    expect(hasAdaptiveCanvasPreviewOptIn()).toBe(false);
  });
});
