"use client";

import { Bell } from "@/components/icons";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/** React Bits BellToggle adapted to controlled, server-confirmed notification preferences. */
export function BellToggle({ pressed, onChange, disabled = false, busy = false,
  offLabel = "Enable notifications", onLabel = "Notifications on", className,
}: { pressed: boolean; onChange: (pressed: boolean) => void; disabled?: boolean; busy?: boolean;
  offLabel?: string; onLabel?: string; className?: string }) {
  const reduced = useReducedMotion();
  return <button type="button" aria-pressed={pressed} aria-busy={busy} disabled={disabled || busy}
    onClick={() => onChange(!pressed)}
    className={cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-orange-500/30 px-5 py-3 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400 disabled:cursor-not-allowed disabled:opacity-50",
      pressed ? "bg-orange-500/10 text-orange-300" : "bg-orange-600 text-white hover:bg-orange-700", className)}>
    <motion.span style={{ transformOrigin: "50% 16%" }}
      animate={{ rotate: pressed && !reduced ? [0, -17, 14, -10, 6, 0] : 0 }}
      transition={{ duration: reduced ? 0 : .7 }}><Bell className="h-4 w-4" aria-hidden="true" /></motion.span>
    <span className="grid">
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">{offLabel}</span>
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">{onLabel}</span>
      <span className="col-start-1 row-start-1">{busy ? "Updating…" : pressed ? onLabel : offLabel}</span>
    </span>
  </button>;
}
