import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  glowColor?: "orange" | "emerald" | "blue" | "purple";
  className?: string;
}

const colorMap = {
  orange: "bg-orange-500",
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
};

const borderMap = {
  orange: "border-orange-500/20 text-orange-400",
  emerald: "border-emerald-500/20 text-emerald-400",
  blue: "border-blue-500/20 text-blue-400",
  purple: "border-purple-500/20 text-purple-400",
};

export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  glowColor = "orange", 
  className 
}: EmptyStateProps) => {
  return (
    <div className={cn("relative flex flex-col items-center justify-center rounded-sm border border-dashed border-[#333] bg-[#0c0b0a] p-12 py-20 text-center overflow-hidden", className)}>
      {/* Ambient background glow */}
      <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 blur-[100px] opacity-[0.15] pointer-events-none rounded-full", colorMap[glowColor])} />
      
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn("mb-6 flex h-16 w-16 items-center justify-center rounded-sm border bg-[#111] relative z-10 shadow-lg", borderMap[glowColor])}
      >
        <Icon className="h-8 w-8" />
      </motion.div>
      
      <motion.h3 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="font-serif text-2xl md:text-3xl text-[#fdfbf7] relative z-10 mb-4 tracking-tight"
      >
        {title}
      </motion.h3>
      
      <motion.p 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        className="text-sm text-[#fdfbf7]/50 max-w-md mx-auto leading-relaxed relative z-10 mb-8"
      >
        {description}
      </motion.p>
      
      {action && (
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="relative z-10"
        >
          {action}
        </motion.div>
      )}
    </div>
  );
};