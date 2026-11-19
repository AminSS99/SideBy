"use client";

/**
 * @author: @kokonutui (SideBy Obsidian Edition)
 * @description: Spring/interpolated tabular number counter with currency, percentage, and decimal formats
 * @version: 1.0.0
 * @license: MIT
 */

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type AnimatedCounterFormat = "integer" | "decimal" | "currency" | "percent";

export interface AnimatedCounterProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Numeric value to interpolate towards, or null/undefined to display fallback text. */
  value: number | null | undefined;
  /** Formatting mode. Default: "integer". */
  format?: AnimatedCounterFormat;
  /** Decimal precision for "decimal", "currency", or "percent". Defaults: 0 (integer/percent), 2 (decimal), 4 (currency). */
  decimals?: number;
  /** Optional prefix string (defaults to "$" for "currency"). */
  prefix?: string;
  /** Optional suffix string (defaults to "%" for "percent"). */
  suffix?: string;
  /** Text rendered when `value` is null, undefined, or NaN. Default: "—". */
  fallback?: string;
  /** Animation duration in milliseconds. Default: 650ms. */
  duration?: number;
  /** When true and format="percent", multiplies 0..1 ratios by 100. Default: false. */
  normalizePercentRatio?: boolean;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return true;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function formatCounterValue(
  rawValue: number,
  format: AnimatedCounterFormat,
  decimals?: number,
  prefix?: string,
  suffix?: string,
  normalizePercentRatio = false
): string {
  const scaled =
    format === "percent" && normalizePercentRatio ? rawValue * 100 : rawValue;

  const resolvedDecimals =
    typeof decimals === "number"
      ? Math.max(0, decimals)
      : format === "currency"
        ? 4
        : format === "decimal"
          ? 2
          : 0;

  const resolvedPrefix = prefix !== undefined ? prefix : format === "currency" ? "$" : "";
  const resolvedSuffix = suffix !== undefined ? suffix : format === "percent" ? "%" : "";

  if (resolvedDecimals === 0) {
    return `${resolvedPrefix}${Math.round(scaled).toLocaleString("en-US")}${resolvedSuffix}`;
  }

  return `${resolvedPrefix}${scaled.toFixed(resolvedDecimals)}${resolvedSuffix}`;
}

export function AnimatedCounter({
  value,
  format = "integer",
  decimals,
  prefix,
  suffix,
  fallback = "—",
  duration = 650,
  normalizePercentRatio = false,
  className,
  ...rest
}: AnimatedCounterProps) {
  const isValidNumber = typeof value === "number" && Number.isFinite(value);
  const targetValue = isValidNumber ? value : 0;

  const [displayNumber, setDisplayNumber] = useState<number>(targetValue);
  const previousValueRef = useRef<number>(targetValue);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isValidNumber) {
      return;
    }

    if (
      prefersReducedMotion() ||
      duration <= 0 ||
      typeof requestAnimationFrame !== "function"
    ) {
      previousValueRef.current = targetValue;
      setDisplayNumber(targetValue);
      return;
    }

    const fromValue = previousValueRef.current;
    const delta = targetValue - fromValue;

    if (Math.abs(delta) < 1e-9) {
      setDisplayNumber(targetValue);
      return;
    }

    const startTime =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    const step = (now: number) => {
      const elapsed = Math.max(0, now - startTime);
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutExpo(progress);
      const current = fromValue + delta * eased;
      setDisplayNumber(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        previousValueRef.current = targetValue;
        setDisplayNumber(targetValue);
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      previousValueRef.current = targetValue;
    };
  }, [duration, isValidNumber, targetValue]);

  const formatted = isValidNumber
    ? formatCounterValue(
        displayNumber,
        format,
        decimals,
        prefix,
        suffix,
        normalizePercentRatio
      )
    : fallback;

  const targetFormatted = isValidNumber
    ? formatCounterValue(
        targetValue,
        format,
        decimals,
        prefix,
        suffix,
        normalizePercentRatio
      )
    : fallback;

  return (
    <span
      data-value={isValidNumber ? String(targetValue) : "na"}
      data-target-formatted={targetFormatted}
      aria-label={targetFormatted}
      className={cn("tabular-nums tracking-tight", className)}
      {...rest}
    >
      {formatted}
    </span>
  );
}

export default AnimatedCounter;
