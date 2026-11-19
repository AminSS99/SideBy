import React from "react";
import { brand } from "@/config/brand";
import { useT } from "@/i18n";

export const BrandFooter = ({ className = "" }: { className?: string }) => {
  const t = useT();
  return (
    <a
      href={brand.companyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex min-h-11 items-center justify-center gap-2.5 rounded-full border border-white/15 bg-white/[0.045] px-3.5 pr-4 text-xs sm:text-sm font-medium normal-case tracking-normal text-[#fdfbf7]/80 shadow-[0_12px_36px_rgba(0,0,0,0.28)] transition-colors duration-300 hover:border-orange-400/35 hover:bg-orange-400/[0.07] hover:text-[#fdfbf7] ${className}`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-[#0e0c0a] p-0.5 shadow-sm">
        <img src="/snapsolve-icon.png" alt="SnapSolve" className="h-full w-full rounded-md object-contain" />
      </span>
      <span className="leading-snug sm:whitespace-nowrap">{t("brand.madeWithLove")}</span>
    </a>
  );
};
