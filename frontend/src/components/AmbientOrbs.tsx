import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export const AmbientOrbs = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    // Orb 1: Orange/Copper drift
    const tween1 = gsap.to(".ambient-orb-1", {
      x: 150,
      y: 100,
      scale: 1.1,
      duration: 12,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // Orb 2: Cyan/Blue drift
    const tween2 = gsap.to(".ambient-orb-2", {
      x: -150,
      y: -100,
      scale: 1.2,
      duration: 15,
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
    <div ref={containerRef} className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      <div className="ambient-orb-1 absolute -top-[20%] -left-[10%] h-[40vw] w-[40vw] max-h-[500px] max-w-[500px] rounded-full bg-orange-600/[0.03] blur-[40px]" />
      <div className="ambient-orb-2 absolute top-[40%] -right-[10%] h-[35vw] w-[35vw] max-h-[450px] max-w-[450px] rounded-full bg-cyan-600/[0.02] blur-[40px]" />
    </div>
  );
};

export default AmbientOrbs;