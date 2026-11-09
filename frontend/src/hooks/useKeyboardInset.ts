import { useEffect, useRef, useState } from "react";

/**
 * Estimated viewport occlusion for forms that must stay actionable.
 *
 * Returns an *estimate* of how many CSS pixels of the layout viewport are
 * occluded from below (typically by the on-screen keyboard), not a
 * guaranteed keyboard height:
 * - Only treated as occlusion while an editable element (input, textarea,
 *   select, contentEditable) holds focus — ordinary browser-chrome movement
 *   and zoom changes without an editor focused are not reported as a
 *   keyboard.
 * - Resets to 0 when disabled or when no occlusion is detected.
 * - Updates are coalesced to animation frames and unchanged values don't
 *   re-render.
 *
 * Consumers add the estimate as a bottom spacer so actions aren't stranded:
 *   const occlusion = useKeyboardInset();
 *   {occlusion > 0 && <div aria-hidden style={{ height: occlusion }} />}
 *
 * Measured from the visual viewport at runtime — never a hardcoded device
 * guess. iOS Safari keeps inputs at >=16px (no auto-zoom). Behavior with
 * physical keyboards, split keyboards, and zoomed viewports is unverified
 * and recorded as such; this estimate is a layout aid, not a measurement.
 */
const EDITABLE_SELECTOR = "input, textarea, select, [contenteditable=''], [contenteditable='true']";

function isEditableFocused(): boolean {
  const active = document.activeElement;
  return Boolean(active && active instanceof Element && active.matches(EDITABLE_SELECTOR));
}

export function useKeyboardInset(enabled = true): number {
  const [inset, setInset] = useState(0);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setInset(0);
      return;
    }
    const viewport = window.visualViewport;
    if (!viewport) {
      setInset(0);
      return;
    }

    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const occlusion = isEditableFocused()
        ? Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop))
        : 0;
      setInset((current) => (current === occlusion ? current : occlusion));
    };
    const schedule = () => {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = window.requestAnimationFrame(measure);
    };

    measure();
    viewport.addEventListener("resize", schedule);
    viewport.addEventListener("scroll", schedule);
    document.addEventListener("focusin", schedule);
    document.addEventListener("focusout", schedule);
    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameRef.current);
      viewport.removeEventListener("resize", schedule);
      viewport.removeEventListener("scroll", schedule);
      document.removeEventListener("focusin", schedule);
      document.removeEventListener("focusout", schedule);
    };
  }, [enabled]);

  return inset;
}
