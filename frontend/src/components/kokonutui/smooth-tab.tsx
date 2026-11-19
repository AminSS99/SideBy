"use client";

/**
 * @author: @kokonutui (SideBy Obsidian Edition)
 * @description: Spring-animated sliding pill tab bar using framer-motion layoutId
 * @version: 1.0.0
 * @license: MIT
 */

import React, { useId, useRef } from "react";
import { MotionConfig, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SmoothTabItem<T extends string = string> {
  id: T;
  label: string;
  /** Optional concise label shown on small viewports (`sm:hidden`). */
  shortLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  disabled?: boolean;
  /** Optional explicit DOM id for `aria-labelledby` linkage. */
  tabId?: string;
  /** Optional panel id for `aria-controls`. */
  controlsId?: string;
}

export type SmoothTabVariant = "pill" | "underline" | "obsidian";

export interface SmoothTabProps<T extends string = string> {
  items: readonly SmoothTabItem<NoInfer<T>>[];
  value: T;
  onValueChange: (value: NoInfer<T>) => void;
  ariaLabel?: string;
  layoutId?: string;
  variant?: SmoothTabVariant;
  /** Number of equal columns on mobile viewports (prevents overflow at 360px). */
  mobileGridCols?: 2 | 3 | 4;
  /** Switch to inline flex on `sm:` and above, or remain a grid. */
  desktopLayout?: "flex" | "grid";
  className?: string;
  tabClassName?: string;
}

const MOBILE_GRID_MAP: Record<2 | 3 | 4, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

const SPRING_TRANSITION = {
  type: "spring" as const,
  stiffness: 420,
  damping: 32,
  mass: 0.85,
};

export function SmoothTab<T extends string>({
  items,
  value,
  onValueChange,
  ariaLabel,
  layoutId,
  variant = "pill",
  mobileGridCols = 3,
  desktopLayout = "flex",
  className,
  tabClassName,
}: SmoothTabProps<T>) {
  const autoId = useId();
  const pillLayoutId = layoutId ?? `smooth-tab-pill-${autoId}`;
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const enabledIndices = items
      .map((item, idx) => (!item.disabled ? idx : -1))
      .filter((idx) => idx >= 0);

    if (enabledIndices.length === 0) return;

    const currentPos = enabledIndices.indexOf(index);
    let targetIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      targetIndex = enabledIndices[(currentPos + 1) % enabledIndices.length];
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      targetIndex = enabledIndices[(currentPos - 1 + enabledIndices.length) % enabledIndices.length];
    } else if (event.key === "Home") {
      targetIndex = enabledIndices[0];
    } else if (event.key === "End") {
      targetIndex = enabledIndices[enabledIndices.length - 1];
    }

    if (targetIndex !== null) {
      event.preventDefault();
      const targetItem = items[targetIndex];
      if (targetItem) {
        onValueChange(targetItem.id);
        buttonRefs.current[targetIndex]?.focus();
      }
    }
  };

  const containerVariantClass =
    variant === "underline"
      ? "border-b border-[#2a2a2a] pb-2 sm:pb-px"
      : variant === "obsidian"
        ? "rounded-2xl border border-white/[0.08] bg-[#0c0b0a]/90 p-1.5 backdrop-blur-xl"
        : "rounded-2xl border border-white/[0.08] bg-[#0b0a09]/92 p-1.5 shadow-[0_12px_30px_rgba(0,0,0,.3)] backdrop-blur-2xl";

  return (
    <MotionConfig reducedMotion="user">
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          "relative grid w-full max-w-full min-w-0 gap-1",
          MOBILE_GRID_MAP[mobileGridCols],
          desktopLayout === "flex" && "sm:flex sm:items-center sm:gap-1.5",
          containerVariantClass,
          className
        )}
      >
        {items.map((item, index) => {
          const isActive = item.id === value;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              id={item.tabId}
              type="button"
              role="tab"
              disabled={item.disabled}
              aria-selected={isActive}
              aria-controls={item.controlsId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => {
                if (!item.disabled) onValueChange(item.id);
              }}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "relative inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 overflow-hidden px-2.5 text-center text-[11px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50",
                "transition-colors duration-200",
                desktopLayout === "flex" && "sm:shrink-0 sm:px-4",
                variant === "underline"
                  ? cn(
                      "rounded-lg py-2.5 text-[11px] font-bold uppercase tracking-widest sm:rounded-t-lg sm:rounded-b-none sm:py-3 sm:text-xs",
                      isActive ? "text-orange-300" : "text-[#fdfbf7]/50 hover:text-[#fdfbf7]"
                    )
                  : cn(
                      "rounded-xl",
                      isActive ? "text-[#fffaf1]" : "text-white/55 hover:text-[#fffaf1]"
                    ),
                item.disabled && "cursor-not-allowed opacity-40",
                tabClassName
              )}
            >
              {isActive && variant === "pill" && (
                <motion.span
                  layoutId={pillLayoutId}
                  transition={SPRING_TRANSITION}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-xl border border-orange-300/25 bg-gradient-to-r from-orange-500 to-rose-500 shadow-[0_10px_24px_rgba(249,115,22,.22)]"
                />
              )}

              {isActive && variant === "obsidian" && (
                <motion.span
                  layoutId={pillLayoutId}
                  transition={SPRING_TRANSITION}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-xl border border-orange-300/25 bg-gradient-to-r from-orange-500/20 via-rose-500/15 to-amber-400/10 shadow-[inset_0_1px_0_rgba(255,250,241,.1)]"
                />
              )}

              {isActive && variant === "underline" && (
                <>
                  <motion.span
                    layoutId={`${pillLayoutId}-bg`}
                    transition={SPRING_TRANSITION}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-lg bg-orange-500/[0.08] sm:rounded-t-lg sm:rounded-b-none"
                  />
                  <motion.span
                    layoutId={pillLayoutId}
                    transition={SPRING_TRANSITION}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-1 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-orange-400 via-amber-300 to-rose-400"
                  />
                </>
              )}

              <span className="relative z-10 flex min-w-0 items-center justify-center gap-1.5">
                {Icon && <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />}
                {item.shortLabel ? (
                  <>
                    <span className="truncate sm:hidden">{item.shortLabel}</span>
                    <span className="hidden truncate sm:inline">{item.label}</span>
                  </>
                ) : (
                  <span className="truncate">{item.label}</span>
                )}
                {item.badge !== undefined && (
                  <span className="shrink-0 rounded-full bg-black/25 px-1.5 py-0.5 text-[9px] font-bold tabular-nums">
                    {item.badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </MotionConfig>
  );
}

export default SmoothTab;
