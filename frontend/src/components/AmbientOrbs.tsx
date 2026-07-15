import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export const AmbientOrbs = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    // Orb 1: Orange/Copper drift
    const tween1 = gsap.to(".ambient-orb-1", {
      xPercent: 22,
      yPercent: 15,
      scale: 1.15,
      duration: 16,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // Orb 2: Cyan/Blue drift
    const tween2 = gsap.to(".ambient-orb-2", {
      xPercent: -24,
      yPercent: -18,
      scale: 1.22,
      duration: 19,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    return () => {
      tween1.kill();
      tween2.kill();
    };
  }, { scope: containerRef });

  return (
    <div ref={containerRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="ambient-orb-1 absolute -left-[28%] -top-[12%] h-[70vw] w-[70vw] max-h-[900px] max-w-[900px] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,.12),rgba(244,63,94,.04)_42%,transparent_70%)] blur-2xl sm:-left-[15%]" />
      <div className="ambient-orb-2 absolute -right-[35%] top-[32%] h-[75vw] w-[75vw] max-h-[860px] max-w-[860px] rounded-full bg-[radial-gradient(circle,rgba(217,70,239,.08),rgba(56,189,248,.035)_44%,transparent_70%)] blur-3xl sm:-right-[18%]" />
    </div>
  );
};

export default AmbientOrbs;
