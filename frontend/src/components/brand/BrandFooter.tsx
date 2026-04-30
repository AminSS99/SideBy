import React from "react";
import { brand } from "@/config/brand";

export const BrandFooter = ({ className = "" }: { className?: string }) => {
  return (
    <a
      href={brand.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#fdfbf7]/30 transition-colors hover:text-orange-400 ${className}`}
    >
      <span>{brand.operatedByLine}</span>
      <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
        &rarr;
      </span>
    </a>
  );
};