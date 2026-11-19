"use client";

/**
 * @author: @kokonutui (SideBy Obsidian Edition)
 * @description: Warm editorial metallic/amber shimmer text effect
 * @version: 1.0.0
 * @license: MIT
 */

import React from "react";
import { cn } from "@/lib/utils";

export type ShimmerTone = "amber" | "rose" | "champagne" | "emerald";

export interface ShimmerTextProps {
  children: React.ReactNode;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "div";
  tone?: ShimmerTone;
  /** Sweep duration in seconds. Default: 3.4s. */
  duration?: number;
  className?: string;
}

const SHIMMER_CSS = `
@keyframes kokonut-shimmer-sweep {
  0% { background-position: 120% 50%; }
  100% { background-position: -120% 50%; }
}
.kokonut-shimmer-text {
  background-size: 240% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: kokonut-shimmer-sweep var(--shimmer-duration, 3.4s) cubic-bezier(0.37, 0, 0.63, 1) infinite;
}
@media (prefers-reduced-motion: reduce) {
  .kokonut-shimmer-text {
    animation: none;
    background-position: 50% 50%;
  }
}
`;

const TONE_GRADIENTS: Record<ShimmerTone, string> = {
  amber:
    "linear-gradient(110deg, #fdba74 0%, #f97316 28%, #fffaf1 50%, #fb7185 72%, #fdba74 100%)",
  rose:
    "linear-gradient(110deg, #fda4af 0%, #f43f5e 30%, #fffaf1 50%, #fb923c 72%, #fda4af 100%)",
  champagne:
    "linear-gradient(110deg, rgba(255,250,241,0.68) 0%, #fde68a 34%, #fffaf1 50%, #fdba74 68%, rgba(255,250,241,0.68) 100%)",
  emerald:
    "linear-gradient(110deg, #6ee7b7 0%, #10b981 30%, #fffaf1 50%, #5eead4 72%, #6ee7b7 100%)",
};

export function ShimmerText({
  children,
  as: Component = "span",
  tone = "amber",
  duration = 3.4,
  className,
}: ShimmerTextProps) {
  return (
    <>
      <style>{SHIMMER_CSS}</style>
      <Component
        className={cn("kokonut-shimmer-text inline-block", className)}
        style={
          {
            backgroundImage: TONE_GRADIENTS[tone],
            "--shimmer-duration": `${duration}s`,
          } as React.CSSProperties
        }
      >
        {children}
      </Component>
    </>
  );
}

export default ShimmerText;
