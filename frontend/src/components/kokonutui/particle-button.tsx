"use client";

/**
 * @author: @kokonutui (SideBy Obsidian Edition)
 * @description: Subtle ember/spark micro-burst click feedback button for high-intent CTAs
 * @version: 1.0.0
 * @license: MIT
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EmberParticle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
}

export type ParticleTone = "ember" | "rose" | "champagne";

export interface ParticleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Number of micro-sparks per burst. Default: 10. */
  particleCount?: number;
  /** Color palette of the spark burst. */
  tone?: ParticleTone;
  /** Optional external href to render as an `<a>` instead of `<button>`. */
  href?: string;
  /** Optional internal route to render as a React Router `<Link>`. */
  to?: string;
  /** Optional anchor target when `href` is provided. */
  target?: string;
  /** Optional anchor rel when `href` is provided. */
  rel?: string;
}

const TONE_COLORS: Record<ParticleTone, readonly string[]> = {
  ember: ["#fb923c", "#f97316", "#fde68a", "#fb7185", "#fffaf1"],
  rose: ["#fb7185", "#f43f5e", "#fda4af", "#fb923c", "#fffaf1"],
  champagne: ["#fde68a", "#fffaf1", "#fdba74", "#fb923c"],
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ParticleButton({
  children,
  className,
  particleCount = 10,
  tone = "ember",
  href,
  to,
  target,
  rel,
  disabled,
  onClick,
  type = "button",
  ...rest
}: ParticleButtonProps) {
  const [particles, setParticles] = useState<EmberParticle[]>([]);
  const nextIdRef = useRef(0);
  const cleanupTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    const timers = cleanupTimersRef.current;
    return () => {
      for (const timer of timers) clearTimeout(timer);
    };
  }, []);

  const spawnBurst = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (disabled || prefersReducedMotion()) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const hasCoords = event.clientX !== 0 || event.clientY !== 0;
      const originX = hasCoords ? event.clientX - rect.left : rect.width / 2;
      const originY = hasCoords ? event.clientY - rect.top : rect.height / 2;

      const palette = TONE_COLORS[tone];
      const count = Math.min(16, Math.max(4, particleCount));
      const batchIds: number[] = [];
      const created: EmberParticle[] = [];

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
        const distance = 18 + Math.random() * 24;
        const id = ++nextIdRef.current;
        batchIds.push(id);
        created.push({
          id,
          x: originX,
          y: originY,
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance - 6,
          size: 3 + (i % 3) * 1.25,
          color: palette[i % palette.length],
        });
      }

      setParticles((prev) => [...prev, ...created]);

      const timer = setTimeout(() => {
        const idSet = new Set(batchIds);
        setParticles((prev) => prev.filter((item) => !idSet.has(item.id)));
      }, 560);
      cleanupTimersRef.current.push(timer);
    },
    [disabled, particleCount, tone]
  );

  const particleOverlay = (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-visible"
    >
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.span
            key={particle.id}
            initial={{
              opacity: 0.95,
              scale: 1,
              x: particle.x,
              y: particle.y,
            }}
            animate={{
              opacity: 0,
              scale: 0.2,
              x: particle.x + particle.dx,
              y: particle.y + particle.dy,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute left-0 top-0 rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              marginLeft: -particle.size / 2,
              marginTop: -particle.size / 2,
              backgroundColor: particle.color,
              boxShadow: `0 0 8px ${particle.color}`,
            }}
          />
        ))}
      </AnimatePresence>
    </span>
  );

  const sharedClasses = cn(
    "relative inline-flex select-none items-center justify-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50",
    "transition-[transform,border-color,background-color,color,box-shadow,filter] duration-200 active:scale-[0.98]",
    className
  );

  if (to) {
    return (
      <Link
        to={to}
        onClick={(event) => {
          spawnBurst(event);
          onClick?.(event as unknown as React.MouseEvent<HTMLButtonElement>);
        }}
        className={sharedClasses}
        aria-label={rest["aria-label"]}
        title={rest.title}
      >
        {particleOverlay}
        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          {children}
        </span>
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        onClick={(event) => {
          spawnBurst(event);
          onClick?.(event as unknown as React.MouseEvent<HTMLButtonElement>);
        }}
        className={sharedClasses}
        aria-label={rest["aria-label"]}
        title={rest.title}
      >
        {particleOverlay}
        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          {children}
        </span>
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={(event) => {
        spawnBurst(event);
        onClick?.(event);
      }}
      className={cn(sharedClasses, disabled && "cursor-not-allowed opacity-50")}
      {...rest}
    >
      {particleOverlay}
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}

export default ParticleButton;
