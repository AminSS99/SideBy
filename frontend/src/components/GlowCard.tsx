import React, { useRef } from "react";
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
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
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