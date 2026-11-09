import { useEffect, useRef, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import "./bottom-notices.css";

/** One layout owner for update/consent notices; individual cards stay in normal flow. */
export function BottomNoticeStack({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const stackRef = useRef<HTMLDivElement>(null);
  const isWorkbench = pathname === "/app" || pathname.startsWith("/app/");

  useEffect(() => {
    const stack = stackRef.current;
    if (!stack) return;
    const root = document.documentElement;
    const previousOffset = root.style.getPropertyValue("--sideby-toast-offset");
    let frame = 0;
    const measure = () => {
      const height = stack.getBoundingClientRect().height;
      const bottom = Number.parseFloat(window.getComputedStyle(stack).bottom) || 0;
      root.style.setProperty("--sideby-toast-offset", `${Math.ceil(height + bottom + 12)}px`);
    };
    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    observer?.observe(stack);
    // Also covers content changes on browsers without ResizeObserver.
    const mutations = new MutationObserver(schedule);
    mutations.observe(stack, { childList: true, subtree: true, characterData: true });
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      mutations.disconnect();
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      if (previousOffset) root.style.setProperty("--sideby-toast-offset", previousOffset);
      else root.style.removeProperty("--sideby-toast-offset");
    };
  }, [isWorkbench]);

  return (
    <div
      ref={stackRef}
      data-workbench={isWorkbench ? "true" : undefined}
      className="sideby-bottom-notices"
    >
      {children}
    </div>
  );
}
