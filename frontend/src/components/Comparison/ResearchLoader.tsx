import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { panelClass, fadeIn } from "./constants";
import type { ResearchStep } from "./types";

interface ResearchLoaderProps {
  query: string;
  progress: number;
  activeStep: number;
  steps: ResearchStep[];
}

export const ResearchLoader = ({
  query,
  progress,
  activeStep,
  steps,
}: ResearchLoaderProps) => (
  <motion.div {...fadeIn} className={`${panelClass} min-h-[500px] p-8 lg:p-12 shadow-2xl`}>
    <div className="mb-12 flex flex-col gap-4 border-b border-[#2a2a2a] pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600">
          SideBy Research Engine
        </p>
        <h2 className="mt-4 font-serif text-3xl text-[#fdfbf7] lg:text-5xl tracking-tight">
          {query}
        </h2>
      </div>
      <div className="flex items-end gap-2">
        <span className="font-serif text-5xl font-light text-orange-500 tabular-nums">
          {progress}
        </span>
        <span className="mb-2 text-sm text-[#fdfbf7]/40">%</span>
      </div>
    </div>

    <div className="mb-10">
      <div className="h-0.5 w-full bg-[#2a2a2a] overflow-hidden">
        <motion.div
          className="h-full bg-orange-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>

    <div className="grid gap-4 font-sans text-sm">
      {steps.map((step, index) => {
        const visible = index <= activeStep;
        const isActive = index === activeStep;
        return (
          <motion.div
            key={step.label}
            className={cn(
              "flex items-center gap-4 px-2 py-2 transition-colors",
              isActive && "bg-[#1a1512] border-l-2 border-orange-600",
              !isActive && "border-l-2 border-transparent"
            )}
            animate={{ opacity: visible ? 1 : 0.3 }}
            transition={{ duration: 0.3 }}
          >
            <span className="w-7 text-[#fdfbf7]/30 tabular-nums text-xs font-serif italic">
              {String(index + 1).padStart(2, "0")}
            </span>
            <step.icon
              className={cn(
                "h-4 w-4",
                isActive ? "text-orange-500" : "text-[#fdfbf7]/30",
              )}
            />
            <div className="flex-1">
              <span className={cn(isActive ? "text-orange-400 font-medium" : "text-[#fdfbf7]/80")}>
                {step.label}
              </span>
            </div>
            {isActive && (
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-orange-500"
              >
                ▍
              </motion.span>
            )}
          </motion.div>
        );
      })}
    </div>
  </motion.div>
);