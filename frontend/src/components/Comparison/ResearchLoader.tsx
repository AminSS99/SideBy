import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";
import { panelClass } from "./constants";
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
}: ResearchLoaderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Smooth progress bar update
    if (barRef.current) {
      gsap.to(barRef.current, {
        width: `${progress}%`,
        duration: 0.8,
        ease: "power2.out",
      });
    }

    // Pulse glow effect
    if (glowRef.current) {
      gsap.to(glowRef.current, {
        opacity: 0.3 + (progress / 100) * 0.5, // Brighter as it progresses
        scale: 1 + (progress / 100) * 0.2,
        duration: 1,
        ease: "power2.out",
      });
    }
    
    // Animate newly active steps
    gsap.fromTo(`.step-${activeStep}`, 
      { opacity: 0.3, x: -10 },
      { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }
    );

  }, [progress, activeStep]);

  return (
    <div ref={containerRef} className={`${panelClass} relative overflow-hidden min-h-[500px] p-8 lg:p-14 shadow-2xl`}>
      {/* Ambient moving glow inside the loader */}
      <div 
        ref={glowRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-2xl bg-orange-600/10 blur-[100px] rounded-full pointer-events-none" 
      />

      <div className="relative z-10 mb-14 flex flex-col gap-6 border-b border-[#2a2a2a] pb-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-4 flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
            </span>
            Synthesizing Sources
          </p>
          <h2 className="font-serif text-3xl text-[#fdfbf7] lg:text-5xl tracking-tight max-w-2xl leading-tight">
            {query}
          </h2>
        </div>
        <div className="flex items-end gap-1">
          <span className="font-serif text-6xl lg:text-7xl font-light text-orange-500 tabular-nums leading-none tracking-tighter">
            {progress}
          </span>
          <span className="mb-2 text-lg text-orange-500/40">%</span>
        </div>
      </div>

      <div className="relative z-10 mb-12">
        <div className="h-0.5 w-full bg-[#1a1a1a] overflow-hidden rounded-full">
          <div
            ref={barRef}
            className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
            style={{ width: "0%" }}
          />
        </div>
      </div>

      <div className="relative z-10 grid gap-5 font-sans text-sm max-w-xl mx-auto">
        {steps.map((step, index) => {
          const visible = index <= activeStep;
          const isActive = index === activeStep;
          return (
            <div
              key={step.label}
              className={cn(
                `step-${index} flex items-center gap-5 px-4 py-3 transition-colors rounded-sm`,
                isActive && "bg-[#1a110a] border border-orange-500/20 shadow-[inset_4px_0_0_0_#ea580c]",
                !isActive && visible && "border border-transparent opacity-60",
                !visible && "opacity-20 border border-transparent"
              )}
            >
              <span className="w-6 text-[#fdfbf7]/30 tabular-nums text-xs font-serif italic text-right">
                0{index + 1}
              </span>
              <step.icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-orange-500" : "text-[#fdfbf7]/30",
                )}
              />
              <div className="flex-1 min-w-0">
                <p className={cn("truncate", isActive ? "text-orange-400 font-bold tracking-wide" : "text-[#fdfbf7]/80")}>
                  {step.label}
                </p>
                {isActive && (
                  <p className="text-[10px] text-orange-500/60 uppercase tracking-widest mt-1 truncate">
                    {step.detail}
                  </p>
                )}
              </div>
              {isActive && (
                <span className="text-orange-500 animate-pulse text-lg">
                  ▍
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};