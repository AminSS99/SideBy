import React from "react";
import { brand } from "@/config/brand";

export const BrandFooter = ({ className = "" }: { className?: string }) => {
  return (
    <a
      href={brand.companyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex min-h-11 items-center justify-center gap-3 rounded-full border border-white/15 bg-white/[0.045] px-4 pr-5 text-sm font-medium normal-case tracking-normal text-[#fdfbf7]/75 shadow-[0_12px_36px_rgba(0,0,0,0.28)] transition-all duration-300 hover:border-orange-400/30 hover:bg-orange-400/[0.07] hover:text-[#fdfbf7] ${className}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-[#f4f1ea] shadow-[inset_0_1px_3px_rgba(255,255,255,0.75),0_2px_10px_rgba(0,0,0,0.35)]">
        <img src="/snapsolve.png" alt="" className="h-full w-full rounded-full object-cover" />
      </span>
      <span>Made with love by SnapSolve</span>
    </a>
  );
};
