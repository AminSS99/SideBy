import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";
import { panelClass } from "./constants";
import { Terminal } from "lucide-react";
import type { ResearchStep } from "./types";

interface ResearchLoaderProps {
  query: string;
  progress: number;
  activeStep: number;
  steps: ResearchStep[];
}

const TERMINAL_LOGS = [
  "Initializing deep extraction subroutines...",
  "Routing query to optimal LLM provider...",
  "Acquiring official documentation targets...",
  "Bypassing generic marketing language...",
  "Parsing DOM tree for technical specifications...",
  "Cross-referencing GitHub activity and issues...",
  "Evaluating pricing vectors against limits...",
  "Synthesizing consensus data points...",
  "Resolving conflicting claims via source weighting...",
  "Drafting executive verdict...",
  "Finalizing data matrix..."
];

export const ResearchLoader = ({
  query,
  progress,
  activeStep,
  steps,
}: ResearchLoaderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const scanLineRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  
  const [activeLogs, setActiveLogs] = useState<string[]>([]);

  // Simulate terminal logs trickling in based on progress
  useEffect(() => {
    const targetLogCount = Math.max(1, Math.floor((progress / 100) * TERMINAL_LOGS.length));
    
    if (activeLogs.length < targetLogCount) {
      const newLogs = TERMINAL_LOGS.slice(0, targetLogCount);
      setActiveLogs(newLogs);
    }
  }, [progress, activeLogs.length]);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeLogs]);

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
        opacity: 0.2 + (progress / 100) * 0.4,
        scale: 1 + (progress / 100) * 0.15,
        duration: 1,
        ease: "power2.out",
      });
    }
    
    // Scanning line effect over the entire container
    if (scanLineRef.current) {
      gsap.fromTo(scanLineRef.current,
        { top: "0%", opacity: 0 },
        { 
          top: "100%", 
          opacity: 0.5, 
          duration: 3, 
          repeat: -1, 
          yoyo: true,
          ease: "linear" 
        }
      );
    }
    
    // Animate newly active steps
    gsap.fromTo(`.step-${activeStep}`, 
      { opacity: 0.3, x: -10 },
      { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }
    );

  }, [progress, activeStep]);

  return (
    <div ref={containerRef} className={cn(panelClass, "relative overflow-hidden min-h-[600px] shadow-2xl flex flex-col")}>
      {/* Ambient moving glow inside the loader */}
      <div 
        ref={glowRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] max-w-3xl max-h-3xl bg-orange-600/10 blur-[120px] rounded-full pointer-events-none z-0" 
      />
      
      {/* Cinematic scanning line */}
      <div 
        ref={scanLineRef}
        className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent pointer-events-none z-20 shadow-[0_0_15px_#ea580c]"
      />

      <div className="relative z-10 flex-none p-8 lg:p-14">
        <div className="mb-14 flex flex-col gap-6 border-b border-[#2a2a2a] pb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-4 flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
              </span>
              Orchestration Active
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

        <div className="mb-12">
          <div className="h-0.5 w-full bg-[#1a1a1a] overflow-hidden rounded-full">
            <div
              ref={barRef}
              className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
              style={{ width: "0%" }}
            />
          </div>
        </div>

        <div className="grid gap-4 font-sans text-sm max-w-xl mx-auto w-full">
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
      
      {/* Terminal View */}
      <div className="relative z-10 mt-auto flex-none border-t border-[#2a2a2a] bg-[#0c0b0a]/80 backdrop-blur-sm p-6 h-48 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="h-4 w-4 text-[#fdfbf7]/30" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/30">Extraction Log</span>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar font-mono text-[10px] sm:text-xs text-emerald-500/70 space-y-2">
          {activeLogs.map((log, i) => (
            <div key={i} className="flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
              <span className="text-emerald-500/30 opacity-50 select-none">
                {new Date().toISOString().split('T')[1].slice(0, -1)}
              </span>
              <span>{log}</span>
            </div>
          ))}
          <div ref={terminalEndRef} className="h-2 flex items-center gap-2">
            <span className="text-emerald-500 animate-pulse">_</span>
          </div>
        </div>
      </div>
    </div>
  );
};