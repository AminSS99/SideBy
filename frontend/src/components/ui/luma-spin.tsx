import React from "react";
import { cn } from "@/lib/utils";

export interface LumaSpinProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  tone?: "brand" | "neutral";
}

const SIZE_MAP = {
  sm: 44,
  md: 65,
  lg: 78,
} as const;

export const LumaSpin = ({
  className,
  size = "md",
  tone = "brand",
}: LumaSpinProps) => {
  const px = SIZE_MAP[size];
  const insetPx = Math.round(px * (35 / 65));

  const ringClass =
    tone === "brand"
      ? "shadow-[inset_0_0_0_3px_rgba(255,250,241,0.92)]"
      : "shadow-[inset_0_0_0_3px] shadow-gray-800 dark:shadow-gray-100";

  const accentRingClass =
    tone === "brand"
      ? "shadow-[inset_0_0_0_3px_rgba(251,146,60,0.92)]"
      : "shadow-[inset_0_0_0_3px] shadow-gray-800 dark:shadow-gray-100";

  return (
    <div
      className={cn("relative aspect-square shrink-0", className)}
      style={{
        width: `${px}px`,
        ["--luma-inset" as string]: `${insetPx}px`,
      }}
      aria-hidden="true"
    >
      <span
        className={cn(
          "absolute rounded-[50px] luma-spin-ring",
          ringClass,
        )}
      />
      <span
        className={cn(
          "absolute rounded-[50px] luma-spin-ring luma-spin-ring-delay",
          accentRingClass,
        )}
      />
      <style>{`
        @keyframes sidebyLumaAnim {
          0% {
            inset: 0 var(--luma-inset, 35px) var(--luma-inset, 35px) 0;
          }
          12.5% {
            inset: 0 var(--luma-inset, 35px) 0 0;
          }
          25% {
            inset: var(--luma-inset, 35px) var(--luma-inset, 35px) 0 0;
          }
          37.5% {
            inset: var(--luma-inset, 35px) 0 0 0;
          }
          50% {
            inset: var(--luma-inset, 35px) 0 0 var(--luma-inset, 35px);
          }
          62.5% {
            inset: 0 0 0 var(--luma-inset, 35px);
          }
          75% {
            inset: 0 0 var(--luma-inset, 35px) var(--luma-inset, 35px);
          }
          87.5% {
            inset: 0 0 var(--luma-inset, 35px) 0;
          }
          100% {
            inset: 0 var(--luma-inset, 35px) var(--luma-inset, 35px) 0;
          }
        }
        .luma-spin-ring {
          animation: sidebyLumaAnim 2.2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
        .luma-spin-ring-delay {
          animation-delay: -1.1s;
        }
        @media (prefers-reduced-motion: reduce) {
          .luma-spin-ring {
            animation: none;
            inset: 0;
          }
        }
      `}</style>
    </div>
  );
};

// Compatibility export matching the original snippet signature
export const Component = LumaSpin;
export default LumaSpin;
