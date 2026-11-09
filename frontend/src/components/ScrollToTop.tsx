import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Scroll ownership for route changes.
 *
 * - Forward navigation (PUSH/REPLACE) starts at the top, as users expect.
 * - Back/forward (POP) restores where the user left that page, so returning
 *   from a comparison detail to the history list keeps their place instead
 *   of dumping them at the top.
 *
 * Positions are kept in memory for the session only (keyed by pathname);
 * nothing is persisted across reloads.
 */
const positions = new Map<string, number>();
const MAX_POSITIONS = 40;

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const previousPath = useRef<string | null>(null);

  // Continuously record the outgoing page's position.
  useEffect(() => {
    const onScroll = () => {
      if (previousPath.current) {
        positions.set(previousPath.current, window.scrollY);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;

    if (navigationType === "POP") {
      const saved = positions.get(pathname);
      if (saved !== undefined && saved > 0) {
        // Wait a frame so the incoming page has laid out before restoring.
        requestAnimationFrame(() => window.scrollTo(0, saved));
        return;
      }
    }

    if (positions.size > MAX_POSITIONS) positions.clear();
    window.scrollTo(0, 0);
  }, [pathname, navigationType]);

  return null;
};

export default ScrollToTop;
