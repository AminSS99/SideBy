"use client";

/**
 * @author: @kokonutui (SideBy Obsidian Edition)
 * @description: Cursor-tracked warm-amber radial spotlight Bento card container
 * @version: 1.0.0
 * @license: MIT
 */

import React, { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type BentoSpotlightTone = "amber" | "rose" | "sky" | "fuchsia" | "emerald";

export interface BentoSpotlightProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  as?: "div" | "article" | "section";
  tone?: BentoSpotlightTone;
  /** Radius of the cursor spotlight in CSS pixels. Default: 340. */
  radius?: number;
  /** Optional class name for the inner z-10 content wrapper. */
  contentClassName?: string;
}

const TONE_SPOT_COLORS: Record<
  BentoSpotlightTone,
  { glow: string; rim: string; ambient: string }
> = {
  amber: {
    glow: "rgba(249, 115, 22, 0.16)",
    rim: "rgba(251, 146, 60, 0.36)",
    ambient: "rgba(249, 115, 22, 0.08)",
  },
  rose: {
    glow: "rgba(244, 63, 94, 0.15)",
    rim: "rgba(251, 113, 133, 0.34)",
    ambient: "rgba(244, 63, 94, 0.07)",
  },
  sky: {
    glow: "rgba(56, 189, 248, 0.14)",
    rim: "rgba(96, 165, 250, 0.32)",
    ambient: "rgba(56, 189, 248, 0.07)",
  },
  fuchsia: {
    glow: "rgba(217, 70, 239, 0.14)",
    rim: "rgba(232, 121, 249, 0.32)",
    ambient: "rgba(217, 70, 239, 0.07)",
  },
  emerald: {
    glow: "rgba(16, 185, 129, 0.14)",
    rim: "rgba(52, 211, 153, 0.3)",
    ambient: "rgba(16, 185, 129, 0.07)",
  },
};

export function BentoSpotlight({
  children,
  as: Component = "div",
  tone = "amber",
  radius = 340,
  className,
  contentClassName,
  onMouseMove,
  onMouseLeave,
  ...rest
}: BentoSpotlightProps) {
  const hostRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const coordsRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      onMouseMove?.(event);
      const node = hostRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      coordsRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          if (hostRef.current && coordsRef.current) {
            hostRef.current.style.setProperty("--spot-x", `${coordsRef.current.x}px`);
            hostRef.current.style.setProperty("--spot-y", `${coordsRef.current.y}px`);
          }
        });
      }
    },
    [onMouseMove]
  );

  const handleMouseLeave = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      onMouseLeave?.(event);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      coordsRef.current = null;
    },
    [onMouseLeave]
  );

  const palette = TONE_SPOT_COLORS[tone];
  const Tag = Component as React.ElementType;

  return (
    <Tag
      ref={hostRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group/spot relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0b0a] transition-[border-color,background-color,box-shadow] duration-300",
        className
      )}
      {...rest}
    >
      {/* Clean static mobile / resting ambient crown */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-75 transition-opacity duration-300 group-hover/spot:opacity-30"
        style={{
          background: `radial-gradient(240px circle at 50% 0%, ${palette.ambient}, transparent 70%)`,
        }}
      />

      {/* Cursor-tracked interior radial spotlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background: `radial-gradient(${radius}px circle at var(--spot-x, 50%) var(--spot-y, 0%), ${palette.glow}, transparent 65%)`,
        }}
      />

      {/* Cursor-tracked hairline rim sheen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] p-px opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background: `radial-gradient(${Math.round(radius * 0.72)}px circle at var(--spot-x, 50%) var(--spot-y, 0%), ${palette.rim}, transparent 65%)`,
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      <div className={cn("relative z-10 h-full", contentClassName)}>
        {children}
      </div>
    </Tag>
  );
}

export default BentoSpotlight;
