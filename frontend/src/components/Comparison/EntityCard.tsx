import React from "react";
import { colors } from "@/config/brand";
import { resolveLogo } from "@/lib/logos";
import { panelClass } from "./constants";
import type { Entity } from "./types";

interface EntityCardProps {
  entity: Entity;
  side: "a" | "b";
}

export const EntityCard = ({ entity, side }: EntityCardProps) => {
  const accentColor = side === "a" ? colors.entityA : colors.entityB;
  const logo = resolveLogo(entity.name);
  
  return (
    <div
      className={`${panelClass} overflow-hidden border-t-2 p-8`}
      style={{ borderTopColor: accentColor }}
    >
      <div className="mb-6 flex items-center gap-5">
        {logo ? (
          <div className="flex h-14 w-14 items-center justify-center rounded-sm overflow-hidden bg-[#1a1a1a] border border-[#333]">
            <img
              src={logo.url}
              alt={entity.name}
              className="h-8 w-8 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="font-serif text-2xl" style="color:${accentColor}">${entity.mark}</span>`;
              }}
            />
          </div>
        ) : (
          <div
            className="flex h-14 w-14 items-center justify-center rounded-sm border font-serif text-2xl"
            style={{
              borderColor: `${accentColor}40`,
              background: `${accentColor}10`,
              color: accentColor,
            }}
          >
            {entity.mark}
          </div>
        )}
        <div>
          <p className="font-serif text-2xl text-[#fdfbf7]">{entity.name}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/50 mt-1">
            {entity.subtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden border border-[#2a2a2a] bg-[#2a2a2a]">
        {["Pricing", "Docs", "Capabilities", "Ecosystem"].map((label) => (
          <div key={label} className="bg-[#0c0b0a] p-4 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 mb-1">
              {label}
            </p>
            <p className="text-xs font-semibold text-emerald-500">
              Verified
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};