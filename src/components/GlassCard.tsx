import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "blue" | "orange" | "purple";
}

const GlassCard = ({ children, className, glowColor }: GlassCardProps) => {
  const glowClasses = {
    blue: "after:bg-blue-500/10",
    orange: "after:bg-orange-500/10",
    purple: "after:bg-purple-500/10",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 transition-all duration-300 hover:border-white/20 hover:bg-black/50 group",
        glowColor && `after:absolute after:-inset-4 after:z-[-1] after:blur-3xl ${glowClasses[glowColor]}`,
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassCard;