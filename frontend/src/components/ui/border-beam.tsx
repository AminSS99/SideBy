"use client";

import type { CSSProperties } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

/** Magic UI border-beam adapted to work with both Tailwind 3 and 4. */
export function BorderBeam({ size = 80, duration = 9, colorFrom = "#f87171", colorTo = "#fb7185",
  delay = 0, reverse = false }: { size?: number; duration?: number; colorFrom?: string;
  colorTo?: string; delay?: number; reverse?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { margin: "40px" });
  const reduced = useReducedMotion();
  const style: CSSProperties = {
    border: "1px solid transparent", borderRadius: "inherit",
    maskImage: "linear-gradient(#000,#000),linear-gradient(#000,#000)",
    maskClip: "padding-box,border-box", maskComposite: "exclude",
  };
  return <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={style}>
    {!reduced && visible && <motion.div className="absolute aspect-square" style={{ width: size,
      background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
      offsetPath: "rect(0 auto auto 0 round 24px)" }}
      initial={{ offsetDistance: reverse ? "100%" : "0%" }}
      animate={{ offsetDistance: reverse ? "0%" : "100%" }}
      transition={{ duration, delay, repeat: Infinity, ease: "linear" }} />}
  </div>;
}
