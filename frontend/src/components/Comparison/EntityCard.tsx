import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { colors } from "@/config/brand";
import { resolveLogo } from "@/lib/logos";
import { panelClass } from "./constants";
import type { Entity } from "./types";

interface EntityCardProps {
  entity: Entity;
  side: "a" | "b";
}

export const EntityCard = ({ entity, side }: EntityCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const accentColor = side === "a" ? colors.entityA : colors.entityB;
  const logo = resolveLogo(entity.name);

  // 3D Tilt Effect on Mouse Move
  useGSAP(() => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    const xTo = gsap.quickTo(card, "rotationY", { ease: "power3", duration: 0.5 });
    const yTo = gsap.quickTo(card, "rotationX", { ease: "power3", duration: 0.5 });
    const bgTo = gsap.quickTo(card, "background", { ease: "power3", duration: 0.5 });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const xPct = x / rect.width - 0.5;
      const yPct = y / rect.height - 0.5;

      xTo(xPct * 10); // Tilt multiplier
      yTo(-yPct * 10);
      
      // Dynamic gradient that follows mouse
      bgTo(`radial-gradient(circle at ${x}px ${y}px, ${accentColor}15 0%, #0c0b0a 60%)`);
    };

    const handleMouseLeave = () => {
      xTo(0);
      yTo(0);
      bgTo("#0c0b0a");
      gsap.to(card, { rotationY: 0, rotationX: 0, duration: 0.8, ease: "elastic.out(1, 0.3)" });
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, { scope: cardRef });

  return (
    <div
      ref={cardRef}
      className={`${panelClass} overflow-hidden border-t-2 p-6 sm:p-8 transition-shadow hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]`}
      style={{ borderTopColor: accentColor }}
    >
      <div className="mb-6 flex items-center gap-4 sm:gap-5 transform-translate-z-20">
        {logo && !logoFailed ? (
          <div 
            className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-sm overflow-hidden bg-[#1a1a1a] border border-[#333] shadow-lg shrink-0"
            style={{ background: `${accentColor}10` }}
          >
            <img
              src={logo.url}
              alt={entity.name}
              className="h-7 w-7 sm:h-8 sm:w-8 object-contain"
              onError={() => setLogoFailed(true)}
              loading="lazy"
            />
          </div>
        ) : (
          <div
            className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-sm border font-serif text-xl sm:text-2xl shadow-lg shrink-0"
            style={{
              borderColor: `${accentColor}40`,
              background: `${accentColor}10`,
              color: accentColor,
            }}
          >
            {entity.mark || entity.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-serif text-xl sm:text-2xl text-[#fdfbf7] truncate">{entity.name}</p>
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/50 mt-1 truncate">
            {entity.subtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden border border-[#2a2a2a] bg-[#2a2a2a] transform-translate-z-10">
        {["Pricing", "Docs", "Capabilities", "Ecosystem"].map((label) => (
          <div key={label} className="bg-[#0c0b0a] p-3 sm:p-4 text-center transition-colors hover:bg-[#111]">
            <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 mb-1">
              {label}
            </p>
            <p className="text-[10px] sm:text-xs font-semibold text-emerald-500">
              Verified
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};