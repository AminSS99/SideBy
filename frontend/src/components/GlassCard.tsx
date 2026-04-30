import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "purple" | "sky" | "emerald";
}

const glowMap = {
  purple: "after:bg-purple-500/[0.06]",
  sky: "after:bg-sky-500/[0.06]",
  emerald: "after:bg-emerald-500/[0.06]",
};

const GlassCard = ({ children, className, glowColor }: GlassCardProps) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]",
      glowColor && `after:absolute after:-inset-3 after:-z-10 after:blur-3xl after:opacity-50 ${glowMap[glowColor]}`,
      className,
    )}
  >
    {children}
  </div>
);

export default GlassCard;
