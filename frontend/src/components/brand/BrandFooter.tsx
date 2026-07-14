import React from "react";
import { brand } from "@/config/brand";

export const BrandFooter = ({ className = "" }: { className?: string }) => {
  return (
    <a
      href={brand.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex h-8 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 pr-4 text-[12px] font-medium normal-case tracking-normal text-[#fdfbf7]/70 shadow-[0_10px_30px_rgba(0,0,0,0.22)] transition-all duration-300 hover:border-orange-400/30 hover:bg-orange-400/[0.06] hover:text-[#fdfbf7] ${className}`}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[#f4f1ea] shadow-[inset_0_1px_3px_rgba(255,255,255,0.75),0_2px_10px_rgba(0,0,0,0.35)]">
        <img src="/icon.svg" alt="" className="h-5 w-5 rounded-full object-contain" />
      </span>
      <span>Made with love by SnapSolve</span>
    </a>
  );
};
