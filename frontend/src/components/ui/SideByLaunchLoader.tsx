import React, { useEffect, useState } from "react";
import { LumaSpin } from "./luma-spin";

const SPLASH_SESSION_KEY = "sideby:launch-intro-seen";
const LETTERS = [
  { char: "S", accent: false },
  { char: "i", accent: false },
  { char: "d", accent: false },
  { char: "e", accent: false },
  { char: "B", accent: true },
  { char: "y", accent: true },
] as const;

function shouldPlayLaunchIntro(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof navigator !== "undefined" && navigator.webdriver) return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    if (window.sessionStorage.getItem(SPLASH_SESSION_KEY) === "1") return false;
    window.sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

export const SideByLaunchLoader: React.FC = () => {
  const [phase, setPhase] = useState<"playing" | "exiting" | "done">(() =>
    shouldPlayLaunchIntro() ? "playing" : "done",
  );

  useEffect(() => {
    if (phase === "done") return;

    const exitTimer = window.setTimeout(() => {
      setPhase("exiting");
    }, 1350);

    const doneTimer = window.setTimeout(() => {
      setPhase("done");
    }, 1780);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading SideBy"
      className={`fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden bg-[#060504] text-[#fffaf1] transition-[opacity,transform] duration-400 ease-out ${
        phase === "exiting" ? "pointer-events-none scale-[1.02] opacity-0" : "opacity-100"
      }`}
    >
      {/* Subtle ambient editorial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.16)_0%,rgba(244,63,94,0.08)_45%,transparent_72%)] blur-2xl"
      />

      <div className="relative z-10 flex flex-col items-center gap-7">
        <LumaSpin size="md" tone="brand" />

        {/* Letter-by-letter S i d e B y wordmark reveal */}
        <div
          className="flex items-baseline gap-[0.04em] font-serif text-4xl font-medium tracking-[-0.03em] sm:text-5xl"
          aria-hidden="true"
        >
          {LETTERS.map((item, index) => (
            <span
              key={`${item.char}-${index}`}
              className={`inline-block sideby-letter-in ${
                item.accent
                  ? "bg-gradient-to-r from-orange-300 via-rose-300 to-fuchsia-300 bg-clip-text italic text-transparent"
                  : "text-[#fffaf1]"
              }`}
              style={{
                animationDelay: `${120 + index * 85}ms`,
              }}
            >
              {item.char}
            </span>
          ))}
        </div>

        {/* Hairline shimmer bar underneath */}
        <div className="relative h-[2px] w-28 overflow-hidden rounded-full bg-white/10">
          <div className="sideby-launch-bar h-full w-full rounded-full bg-gradient-to-r from-orange-400 via-rose-400 to-fuchsia-400" />
        </div>
      </div>

      <style>{`
        @keyframes sidebyLetterIn {
          0% {
            opacity: 0;
            transform: translateY(14px) scale(0.94);
            filter: blur(8px);
          }
          70% {
            opacity: 1;
            transform: translateY(-1px) scale(1.01);
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
        }
        @keyframes sidebyLaunchBar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(0%);
          }
        }
        .sideby-letter-in {
          opacity: 0;
          animation: sidebyLetterIn 520ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: transform, opacity, filter;
        }
        .sideby-launch-bar {
          transform: translateX(-100%);
          animation: sidebyLaunchBar 1100ms cubic-bezier(0.22, 1, 0.36, 1) 120ms forwards;
          will-change: transform;
        }
      `}</style>
    </div>
  );
};

export default SideByLaunchLoader;
