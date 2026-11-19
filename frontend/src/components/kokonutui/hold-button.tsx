"use client";

/**
 * @author: @kokonutui (SideBy Obsidian Edition)
 * @description: Tactile Hold-to-Confirm Button with smooth fill & radial progress ring
 * @version: 1.0.0
 * @license: MIT
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Check, Trash2 } from "@/components/icons";
import { cn } from "@/lib/utils";

export type HoldButtonVariant = "destructive" | "amber" | "obsidian";

export interface HoldButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "onClick" | "onMouseDown" | "onMouseUp" | "onMouseLeave" | "onTouchStart" | "onTouchEnd" | "onKeyDown" | "onKeyUp"
  > {
  /** Invoked once the user holds the button for the full `holdDuration`. */
  onConfirm: () => void;
  /** Duration in milliseconds required to confirm. Default: 1200ms. */
  holdDuration?: number;
  /** Visual variant aligned with SideBy's obsidian palette. */
  variant?: HoldButtonVariant;
  /** Optional custom icon rendered inside the progress ring. */
  icon?: React.ReactNode;
  /** Optional label displayed while holding (defaults to `children`). */
  holdingLabel?: React.ReactNode;
  /** Optional label displayed briefly after confirmation (defaults to `children`). */
  confirmedLabel?: React.ReactNode;
  /** Show the circular SVG progress ring beside the label. Default: true. */
  showRing?: boolean;
  /** Reset confirmed state after this many ms. Default: 1400ms. */
  confirmedDuration?: number;
}

const VARIANT_STYLES: Record<
  HoldButtonVariant,
  {
    base: string;
    fill: string;
    ringTrack: string;
    ringProgress: string;
    confirmed: string;
  }
> = {
  destructive: {
    base: "border-rose-500/30 bg-[#0c0b0a] text-rose-200 hover:border-rose-400/55 hover:bg-rose-500/[0.08] focus-visible:ring-rose-400/50",
    fill: "bg-gradient-to-r from-rose-600/45 via-rose-500/40 to-orange-500/35",
    ringTrack: "stroke-rose-400/20",
    ringProgress: "stroke-rose-300",
    confirmed: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  },
  amber: {
    base: "border-orange-400/30 bg-[#0c0b0a] text-orange-200 hover:border-orange-400/55 hover:bg-orange-500/[0.09] focus-visible:ring-orange-400/50",
    fill: "bg-gradient-to-r from-orange-500/45 via-amber-500/35 to-rose-500/40",
    ringTrack: "stroke-orange-400/20",
    ringProgress: "stroke-orange-300",
    confirmed: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  },
  obsidian: {
    base: "border-white/15 bg-[#0c0b0a] text-[#fffaf1]/85 hover:border-orange-300/35 hover:bg-white/[0.06] focus-visible:ring-orange-300/40",
    fill: "bg-gradient-to-r from-orange-500/30 via-rose-500/25 to-amber-400/25",
    ringTrack: "stroke-white/15",
    ringProgress: "stroke-[#fffaf1]",
    confirmed: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  },
};

const RING_RADIUS = 8;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HoldButton({
  onConfirm,
  holdDuration = 1200,
  variant = "destructive",
  icon,
  holdingLabel,
  confirmedLabel,
  showRing = true,
  confirmedDuration = 1400,
  disabled = false,
  className,
  children,
  type = "button",
  ...rest
}: HoldButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);

  const isHoldingRef = useRef(false);
  const startTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    setReducedMotion(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const clearPendingTimers = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (confirmTimerRef.current !== null) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
  }, []);

  const cancelHold = useCallback(() => {
    if (!isHoldingRef.current) return;
    isHoldingRef.current = false;
    clearPendingTimers();
    setIsHolding(false);
    setProgress(0);
  }, [clearPendingTimers]);

  const startHold = useCallback(() => {
    if (disabled || isHoldingRef.current) return;

    if (resetTimerRef.current !== null) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    isHoldingRef.current = true;
    setIsConfirmed(false);
    setIsHolding(true);
    setProgress(0);
    startTimeRef.current = performance.now();

    const duration = Math.max(100, holdDuration);

    const tick = (now: number) => {
      if (!isHoldingRef.current) return;
      const elapsed = now - startTimeRef.current;
      const ratio = Math.min(1, elapsed / duration);
      setProgress(ratio);
      if (ratio < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    if (!reducedMotion && typeof requestAnimationFrame === "function") {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      setProgress(1);
    }

    confirmTimerRef.current = setTimeout(() => {
      if (!isHoldingRef.current) return;
      isHoldingRef.current = false;
      clearPendingTimers();
      setIsHolding(false);
      setProgress(1);
      setIsConfirmed(true);

      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(14);
      }

      onConfirmRef.current();

      resetTimerRef.current = setTimeout(() => {
        setIsConfirmed(false);
        setProgress(0);
        resetTimerRef.current = null;
      }, confirmedDuration);
    }, duration);
  }, [clearPendingTimers, confirmedDuration, disabled, holdDuration, reducedMotion]);

  useEffect(() => {
    if (disabled) {
      cancelHold();
    }
  }, [disabled, cancelHold]);

  useEffect(() => {
    return () => {
      clearPendingTimers();
      if (resetTimerRef.current !== null) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, [clearPendingTimers]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape") {
      cancelHold();
      return;
    }
    if ((event.key === " " || event.key === "Enter") && !event.repeat) {
      event.preventDefault();
      startHold();
    }
  };

  const handleKeyUp = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      cancelHold();
    }
  };

  const palette = VARIANT_STYLES[variant];
  const dashOffset = RING_CIRCUMFERENCE * (1 - (isConfirmed ? 1 : progress));
  const activeContent = isConfirmed
    ? confirmedLabel ?? children
    : isHolding
      ? holdingLabel ?? children
      : children;

  return (
    <button
      type={type}
      disabled={disabled}
      aria-busy={isHolding}
      data-holding={isHolding ? "true" : "false"}
      data-confirmed={isConfirmed ? "true" : "false"}
      onMouseDown={(event) => {
        if (event.button !== 0) return;
        startHold();
      }}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={(event) => {
        event.preventDefault();
        startHold();
      }}
      onTouchEnd={cancelHold}
      onTouchCancel={cancelHold}
      onBlur={cancelHold}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      className={cn(
        "relative inline-flex min-h-11 select-none items-center justify-center gap-2 overflow-hidden rounded-xl border px-4 text-[10px] font-bold uppercase tracking-[0.16em] outline-none focus-visible:ring-2",
        "transition-[border-color,background-color,color,box-shadow,transform] duration-200",
        !reducedMotion && isHolding && "scale-[0.985]",
        isConfirmed ? palette.confirmed : palette.base,
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      {...rest}
    >
      {/* Tactile sweep fill layer */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 origin-left",
          palette.fill,
          isHolding || isConfirmed ? "opacity-100" : "opacity-0",
          reducedMotion ? "transition-opacity duration-150" : "transition-opacity duration-150"
        )}
        style={{
          transform: `scaleX(${isConfirmed ? 1 : progress})`,
          transitionProperty: reducedMotion ? "opacity" : "opacity",
        }}
      />

      <span className="relative z-10 inline-flex items-center gap-2">
        {showRing && (
          <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
            <svg
              className="h-5 w-5 -rotate-90"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <circle
                cx="10"
                cy="10"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="1.75"
                className={palette.ringTrack}
              />
              <circle
                cx="10"
                cy="10"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                className={cn(
                  isConfirmed ? "stroke-emerald-300" : palette.ringProgress,
                  reducedMotion ? "" : "transition-[stroke-dashoffset] duration-75 ease-linear"
                )}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center">
              {isConfirmed ? (
                <Check className="h-2.5 w-2.5 text-emerald-300" />
              ) : (
                icon ?? <Trash2 className="h-2.5 w-2.5" />
              )}
            </span>
          </span>
        )}
        <span>{activeContent}</span>
      </span>
    </button>
  );
}

export default HoldButton;
