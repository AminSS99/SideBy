import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export const AmbientOrbs = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    
    // Orb 1: Orange/Copper drift
    gsap.to(".ambient-orb-1", {
      x: 150,
      y: 100,
      scale: 1.1,
      duration: 12,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // Orb 2: Cyan/Blue drift
    gsap.to(".ambient-orb-2", {
      x: -150,
      y: -100,
      scale: 1.2,
      duration: 15,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      <div className="ambient-orb-1 absolute -top-[20%] -left-[10%] h-[60vw] w-[60vw] max-h-[800px] max-w-[800px] rounded-full bg-orange-600/[0.04] blur-[120px]" />
      <div className="ambient-orb-2 absolute top-[40%] -right-[10%] h-[50vw] w-[50vw] max-h-[700px] max-w-[700px] rounded-full bg-cyan-600/[0.03] blur-[120px]" />
    </div>
  );
};

export default AmbientOrbs;