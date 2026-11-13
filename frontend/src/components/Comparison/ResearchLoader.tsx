import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { BorderBeam } from "@/components/ui/border-beam";
import { AnimatedList } from "@/components/ui/animated-list";
import React, { useRef, useState, useEffect, useMemo } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";
import { panelClass } from "./constants";
import { Terminal, Check } from "@/components/icons";
import type { ComparisonActivityStep, ResearchStep } from "./types";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

interface ResearchLoaderProps {
  query: string;
  progress: number;
  activeStep: number;
  steps: ResearchStep[];
  activity?: ComparisonActivityStep[];
  sourcesFound?: number;
  factsExtracted?: number;
  dimensionsScored?: number;
}

const NumberTicker = ({ value, reducedMotion }: { value: number; reducedMotion: boolean }) => {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 75, damping: 15 });
  const rounded = useTransform(springValue, (latest) => Math.round(latest));

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return reducedMotion ? <span>{value}</span> : <motion.span>{rounded}</motion.span>;
};

export const ResearchLoader = ({
  query,
  progress,
  activeStep,
  steps,
  activity = [],
  sourcesFound = 0,
  factsExtracted = 0,
  dimensionsScored = 0,
}: ResearchLoaderProps) => {
  const prefersReducedMotion = useReducedMotion() ?? false;

  // Honest elapsed time: a real clock from mount, never an invented ETA.
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const elapsedLabel =
    elapsedSeconds < 60
      ? `${elapsedSeconds}s`
      : `${Math.floor(elapsedSeconds / 60)}m ${String(elapsedSeconds % 60).padStart(2, "0")}s`;

  // A failed pipeline step does not erase the evidence gathered so far; say so.
  const failedStep = activity.find((step) => step.status === "failed");
  const currentStep = activity.find((step) => step.status === "running");
  const containerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const scanLineRef = useRef<HTMLDivElement>(null);
  const terminalScrollRef = useRef<HTMLDivElement>(null);
  
  const liveLogs = useMemo(() => {
    return activity.map((step) => {
      const timestamp = step.startedAt || step.completedAt || new Date().toISOString();
      const summary = step.outputSummary || step.inputSummary || "working through source-backed evidence";
      return {
        id: step.id,
        time: new Date(timestamp).toISOString().split("T")[1].slice(0, -1),
        status: step.status,
        message: `${step.task}/${step.stepName}: ${summary}`,
      };
    });
  }, [activity]);

  // Keep auto-scrolling contained inside the terminal. scrollIntoView() also
  // scrolls ancestor containers and was pulling the loader header under the
  // top edge of the workbench while research was running.
  useEffect(() => {
    const terminal = terminalScrollRef.current;
    if (!terminal) return;

    terminal.scrollTo({
      top: terminal.scrollHeight,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [liveLogs, prefersReducedMotion]);

  const scanLineTweenRef = useRef<gsap.core.Tween | null>(null);

  useGSAP(() => {
    // Smooth progress bar update
    if (barRef.current) {
      gsap.to(barRef.current, {
        width: `${progress}%`,
        duration: prefersReducedMotion ? 0 : 0.8,
        ease: "power2.out",
      });
    }

    // Pulse glow effect
    if (glowRef.current) {
      if (prefersReducedMotion) {
        gsap.set(glowRef.current, { opacity: 0.3, scale: 1 });
      } else {
        gsap.to(glowRef.current, {
          opacity: 0.2 + (progress / 100) * 0.4,
          scale: 1 + (progress / 100) * 0.15,
          duration: 1,
          ease: "power2.out",
        });
      }
    }

    // Scanning line effect over the entire container
    if (scanLineRef.current) {
      if (prefersReducedMotion) {
        scanLineTweenRef.current?.kill();
        gsap.set(scanLineRef.current, { opacity: 0 });
      } else {
        if (scanLineTweenRef.current) {
          scanLineTweenRef.current.kill();
        }
        scanLineTweenRef.current = gsap.fromTo(scanLineRef.current,
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
    }

    // Animate newly active steps
    if (prefersReducedMotion) {
      gsap.set(`.step-${activeStep}`, { opacity: 1, x: 0 });
    } else {
      gsap.fromTo(`.step-${activeStep}`,
        { opacity: 0.3, x: -10 },
        { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }
      );
    }

    // Animate newly completed check icon with springy back pop
    if (activeStep > 0) {
      if (prefersReducedMotion) {
        gsap.set(`.step-${activeStep - 1} .check-icon`, { scale: 1, opacity: 1 });
      } else {
        gsap.fromTo(`.step-${activeStep - 1} .check-icon`,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.8)", clearProps: "transform" }
        );
      }
    }

    if (!prefersReducedMotion) {
      // Continuous rotation for HUD elements
      gsap.to(".hud-ring-1", {
        rotate: 360,
        duration: 35,
        repeat: -1,
        ease: "none",
        transformOrigin: "center center"
      });
      gsap.to(".hud-ring-2", {
        rotate: -360,
        duration: 25,
        repeat: -1,
        ease: "none",
        transformOrigin: "center center"
      });
      gsap.to(".hud-ring-3", {
        rotate: 180,
        duration: 15,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        transformOrigin: "center center"
      });
      gsap.to(".hud-axis", {
        rotate: 360,
        duration: 60,
        repeat: -1,
        ease: "none",
        transformOrigin: "center center"
      });
    }

  }, { dependencies: [progress, activeStep, prefersReducedMotion], scope: containerRef, revertOnUpdate: true });

  return (
    <div ref={containerRef} role="status" aria-live="polite" aria-label={`Researching ${query}, ${progress}% complete`} className={cn(panelClass, "relative flex min-h-[560px] flex-col overflow-hidden rounded-[28px] shadow-2xl")}>
      <BorderBeam colorFrom="#f97316" colorTo="#fb7185" duration={8} />
      {/* Ambient moving glow inside the loader */}
      <div 
        ref={glowRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] max-w-2xl max-h-2xl bg-orange-600/10 blur-[60px] rounded-full pointer-events-none z-0" 
      />
      
      {/* Concentric Rotating Cyber HUD Radar Overlay */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] opacity-[0.035] z-0">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="none" stroke="#ea580c" strokeWidth="0.3" strokeDasharray="3 15" className="hud-ring-1 origin-center" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="#ea580c" strokeWidth="0.1" strokeDasharray="20 4" className="hud-ring-2 origin-center" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="#ea580c" strokeWidth="0.2" className="hud-ring-3 origin-center" />
          <line x1="50" y1="4" x2="50" y2="96" stroke="#ea580c" strokeWidth="0.05" strokeDasharray="2 4" className="hud-axis origin-center" />
          <line x1="4" y1="50" x2="96" y2="50" stroke="#ea580c" strokeWidth="0.05" strokeDasharray="2 4" className="hud-axis origin-center" />
        </svg>
      </div>

      {/* Cinematic scanning line */}
      <div 
        ref={scanLineRef}
        className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent pointer-events-none z-20 shadow-[0_0_15px_#ea580c]"
      />

      <div className="relative z-10 flex-none p-4 sm:p-8 lg:p-12">
        <div className="mb-7 flex flex-col gap-6 border-b border-white/[0.08] pb-6 sm:mb-10 sm:flex-row sm:items-start sm:justify-between sm:gap-8 sm:pb-8">
          <div className="min-w-0 flex-1">
            <p className="mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-orange-300 sm:mb-4 sm:text-[10px]">
              <span className="relative flex h-2 w-2">
                <span className={cn("absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75", !prefersReducedMotion && "animate-ping")} />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
              </span>
              Research in progress
            </p>
            <h2 className="max-w-3xl break-words font-serif text-2xl leading-[1.08] tracking-tight text-[#fdfbf7] sm:text-3xl lg:text-4xl xl:text-5xl">
              {query}
            </h2>
            {(() => {
              const parts = query.split(/\s+(?:vs\.?|versus)\s+/i);
              if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
                return (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-300">
                      Option A: {parts[0].trim()}
                    </span>
                    <span className="text-xs font-medium text-white/40">vs</span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-300">
                      Option B: {parts[1].trim()}
                    </span>
                  </div>
                );
              }
              return null;
            })()}
            <p className="mt-3 text-xs leading-relaxed text-[#fdfbf7]/45">
              Elapsed {elapsedLabel}
              {currentStep ? ` · Now: ${currentStep.task} — ${currentStep.stepName}` : ""}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#fdfbf7]/35">
              Research runs on SideBy's servers. You can leave this page and come back — this view reconciles
              with the job's recorded progress when you return. If a deployment or restart interrupts the run,
              recovery is attempted; if recovery cannot complete, you'll be offered a retry with your gathered evidence preserved.
            </p>
            {failedStep && (
              <p role="note" className="mt-3 inline-flex items-start gap-2 rounded-lg border border-red-400/25 bg-red-400/[0.06] px-3 py-2 text-xs leading-relaxed text-red-200/85">
                A step hit a problem ({failedStep.task} — {failedStep.stepName}). Evidence gathered so far is
                kept; if the job can't recover, you'll get a retry option with your sources preserved.
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center justify-between gap-5 self-stretch rounded-2xl border border-orange-400/15 bg-orange-500/[0.06] px-4 py-3 sm:min-w-36 sm:self-start sm:flex-col sm:items-end sm:gap-1 sm:px-5 sm:py-4">
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-orange-200/50">
              Progress
            </span>
            <AnimatedCircularProgressBar value={progress} label="Research progress"
              gaugePrimaryColor="#fb923c" className="h-24 w-24 text-orange-300" />
          </div>
        </div>

        <div className="mb-7 sm:mb-10">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              ref={barRef}
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-500 shadow-[0_0_18px_rgba(244,63,94,.35)]"
              style={{ width: "0%" }}
            />
          </div>
        </div>

        {/* Live counters ticker */}
        <div className="mx-auto mb-8 grid w-full max-w-xl grid-cols-3 gap-2 sm:mb-10 sm:gap-4">
          <div className="rounded-2xl border border-white/[0.07] bg-black/30 p-3 text-center">
            <span className="text-[8px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 block mb-1">
              Sources
            </span>
            <span className="text-xl font-mono font-bold text-white">
              <NumberTicker value={sourcesFound} reducedMotion={prefersReducedMotion} />
            </span>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-black/30 p-3 text-center">
            <span className="text-[8px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 block mb-1">
              Facts
            </span>
            <span className="text-xl font-mono font-bold text-white">
              <NumberTicker value={factsExtracted} reducedMotion={prefersReducedMotion} />
            </span>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-black/30 p-3 text-center">
            <span className="text-[8px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 block mb-1">
              Scores
            </span>
            <span className="text-xl font-mono font-bold text-white">
              <NumberTicker value={dimensionsScored} reducedMotion={prefersReducedMotion} />
            </span>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-xl gap-2 font-sans text-sm sm:gap-3">
          {steps.map((step, index) => {
            const visible = index <= activeStep;
            const isActive = index === activeStep;
            return (
              <div
                key={step.label}
                className={cn(
                  `step-${index} flex items-center gap-3 rounded-xl px-3 py-3 transition-colors sm:gap-5 sm:px-4`,
                  isActive && "border border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-rose-500/[0.04] shadow-[inset_3px_0_0_0_#f97316]",
                  !isActive && visible && "border border-transparent opacity-60",
                  !visible && "opacity-20 border border-transparent"
                )}
              >
                <span className="w-5 text-right font-serif text-[10px] italic text-[#fdfbf7]/30 tabular-nums sm:w-6 sm:text-xs">
                  0{index + 1}
                </span>
                {index < activeStep ? (
                  <div className="check-icon flex items-center justify-center h-4 w-4 shrink-0 text-emerald-500">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                ) : (
                  <step.icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-orange-500" : "text-[#fdfbf7]/30",
                    )}
                  />
                )}
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
                  <span className={cn("h-2 w-2 rounded-full bg-orange-400", !prefersReducedMotion && "animate-pulse")} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Terminal View */}
      <div className="relative z-10 mt-auto flex h-40 flex-none flex-col border-t border-white/[0.08] bg-black/25 p-4 backdrop-blur-sm sm:h-48 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Terminal className="h-4 w-4 text-[#fdfbf7]/30" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/30">
            {liveLogs.length > 0 ? "Live research feed" : "Research activity"}
          </span>
        </div>
        
        <div ref={terminalScrollRef} className="flex-1 overflow-y-auto no-scrollbar font-mono text-[10px] sm:text-xs text-emerald-500/70 space-y-2">
          <AnimatedList delay={65}>
          {liveLogs.map((log) => (
            <div key={log.id} className="flex gap-2 items-start sm:gap-3">
              <span className="text-emerald-500/30 opacity-50 select-none">
                {log.time}
              </span>
              <span className={cn(
                "rounded-sm border px-1.5 py-0.5 text-[8px] uppercase tracking-widest",
                log.status === "completed" && "border-emerald-500/20 text-emerald-400/70",
                log.status === "running" && "border-orange-500/20 text-orange-400/80",
                log.status === "failed" && "border-red-500/20 text-red-400/80",
                log.status !== "completed" && log.status !== "running" && log.status !== "failed" && "border-[#333] text-[#fdfbf7]/40",
              )}>
                {log.status}
              </span>
              <span className="min-w-0 break-words">{log.message}</span>
            </div>
          ))}
          </AnimatedList>
          {liveLogs.length === 0 && (
            <p className="text-[#fdfbf7]/60">Waiting for the next recorded research update. Your comparison is still being processed.</p>
          )}
          <div className="h-2 flex items-center gap-2">
            <span className={cn("text-emerald-500", !prefersReducedMotion && "animate-pulse")}>_</span>
          </div>
        </div>
      </div>
    </div>
  );
};
