"use client";

/**
 * @author: @kokonutui (SideBy Obsidian Edition)
 * @description: Interactive 3D flip card with keyboard + reduced-motion accessibility
 * @version: 1.0.0
 * @license: MIT
 */

import React, { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface CardFlipProps {
  front: React.ReactNode;
  back: React.ReactNode;
  /** Controlled flip state. */
  flipped?: boolean;
  /** Initial flip state when uncontrolled. */
  defaultFlipped?: boolean;
  onFlipChange?: (flipped: boolean) => void;
  /** Optional hover-triggered flip for pointer devices. Default: false. */
  flipOnHover?: boolean;
  /** Accessible label describing the flippable card. */
  ariaLabel?: string;
  className?: string;
  faceClassName?: string;
}

const FLIP_CSS = `
.kokonut-flip-scene {
  perspective: 1200px;
}
.kokonut-flip-inner {
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.kokonut-flip-inner[data-flipped="true"] {
  transform: rotateY(180deg);
}
.kokonut-flip-face {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.kokonut-flip-back {
  transform: rotateY(180deg);
}
@media (prefers-reduced-motion: reduce) {
  .kokonut-flip-inner {
    transform-style: flat;
    transition: none;
  }
  .kokonut-flip-inner[data-flipped="true"] {
    transform: none;
  }
  .kokonut-flip-back {
    transform: none;
  }
}
`;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function CardFlip({
  front,
  back,
  flipped,
  defaultFlipped = false,
  onFlipChange,
  flipOnHover = false,
  ariaLabel,
  className,
  faceClassName,
}: CardFlipProps) {
  const [internalFlipped, setInternalFlipped] = useState(defaultFlipped);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);

  const isControlled = flipped !== undefined;
  const isFlipped = isControlled ? flipped : internalFlipped;

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    setReducedMotion(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const setFlippedState = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setInternalFlipped(next);
      }
      onFlipChange?.(next);
    },
    [isControlled, onFlipChange]
  );

  const toggleFlip = useCallback(() => {
    setFlippedState(!isFlipped);
  }, [isFlipped, setFlippedState]);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("a, button, input, select, textarea")) {
      return;
    }
    toggleFlip();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleFlip();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isFlipped}
      aria-label={ariaLabel}
      data-flipped={isFlipped ? "true" : "false"}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={flipOnHover ? () => setFlippedState(true) : undefined}
      onMouseLeave={flipOnHover ? () => setFlippedState(false) : undefined}
      className={cn(
        "kokonut-flip-scene group/flip relative cursor-pointer rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50",
        className
      )}
    >
      <style>{FLIP_CSS}</style>
      <div
        data-flipped={isFlipped ? "true" : "false"}
        className="kokonut-flip-inner relative grid h-full w-full"
      >
        {/* Front Face */}
        <div
          aria-hidden={isFlipped}
          className={cn(
            "kokonut-flip-face col-start-1 row-start-1 h-full w-full rounded-[28px]",
            isFlipped && "pointer-events-none",
            reducedMotion &&
              (isFlipped
                ? "opacity-0 transition-opacity duration-200"
                : "opacity-100 transition-opacity duration-200"),
            faceClassName
          )}
        >
          {front}
        </div>

        {/* Back Face */}
        <div
          aria-hidden={!isFlipped}
          className={cn(
            "kokonut-flip-face kokonut-flip-back col-start-1 row-start-1 h-full w-full rounded-[28px]",
            !isFlipped && "pointer-events-none",
            reducedMotion &&
              (isFlipped
                ? "opacity-100 transition-opacity duration-200"
                : "opacity-0 transition-opacity duration-200"),
            faceClassName
          )}
        >
          {back}
        </div>
      </div>
    </div>
  );
}

export default CardFlip;
