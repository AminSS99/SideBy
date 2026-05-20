import React, { useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: string;
  containerClassName?: string;
}

export const GlowCard = ({
  children,
  className,
  containerClassName,
  glowColor = "rgba(234, 88, 12, 0.15)",
  ...props
}: GlowCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    pendingRef.current = { x, y };

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (cardRef.current && pendingRef.current) {
          cardRef.current.style.setProperty("--mouse-x", `${pendingRef.current.x}px`);
          cardRef.current.style.setProperty("--mouse-y", `${pendingRef.current.y}px`);
        }
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pendingRef.current = null;
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative overflow-hidden rounded-sm border border-[#2a2a2a] bg-[#111] transition-colors group",
        containerClassName
      )}
      {...props}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-sm opacity-0 transition duration-300 group-hover:opacity-100 z-0"
        style={{
          background: `radial-gradient(400px circle at var(--mouse-x, 0) var(--mouse-y, 0), ${glowColor}, transparent 40%)`
        }}
      />
      <div className={cn("relative z-10 h-full", className)}>{children}</div>
    </div>
  );
};

export default GlowCard;