"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/** Adapted from the supplied Magic UI gauge; uses actual progress, clamped to its range. */
export function AnimatedCircularProgressBar({ value, min = 0, max = 100,
  gaugePrimaryColor = "currentColor", gaugeSecondaryColor = "rgba(255,255,255,.1)",
  className, label = "Progress", caption,
}: { value: number; min?: number; max?: number; gaugePrimaryColor?: string;
  gaugeSecondaryColor?: string; className?: string; label?: string; caption?: string }) {
  const reduced = useReducedMotion();
  const id = useId();
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) && max > safeMin ? max : safeMin + 100;
  const safeValue = Math.min(safeMax, Math.max(safeMin, Number.isFinite(value) ? value : safeMin));
  const percent = Math.round((safeValue - safeMin) / (safeMax - safeMin) * 100);
  const circumference = 2 * Math.PI * 44;
  return (
    <div role="progressbar" aria-labelledby={id} aria-valuemin={safeMin} aria-valuemax={safeMax}
      aria-valuenow={safeValue} className={cn("relative h-28 w-28 shrink-0", className)}>
      <span id={id} className="sr-only">{label}</span>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r="44" fill="none" stroke={gaugeSecondaryColor} strokeWidth="6" />
        <motion.circle cx="50" cy="50" r="44" fill="none" stroke={gaugePrimaryColor} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circumference}
          initial={false} animate={{ strokeDashoffset: circumference * (1 - percent / 100) }}
          transition={{ duration: reduced ? 0 : .65, ease: [.22, 1, .36, 1] }} />
      </svg>
      <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-semibold tabular-nums tracking-tight">{percent}%</span>
        {caption && <span className="mt-1 text-[10px] uppercase tracking-widest opacity-60">{caption}</span>}
      </div>
    </div>
  );
}
