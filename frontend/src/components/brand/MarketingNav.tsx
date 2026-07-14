import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Docs", to: "/docs" },
  { label: "Workbench", to: "/app" },
];

export const MarketingNav = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 h-20 pointer-events-none">
      <div className="mx-auto flex h-full w-full max-w-7xl items-start justify-between px-4 sm:px-6">
        <Link
          to="/"
          aria-label="SideBy home"
          className="pointer-events-auto mt-3 inline-flex h-11 items-center gap-2.5 rounded-full border border-white/[0.08] bg-black/90 px-2.5 text-[#fdfbf7] shadow-[0_18px_45px_rgba(0,0,0,0.42)] backdrop-blur-xl transition-all duration-300 hover:border-orange-400/25 hover:bg-black md:px-3 md:pr-4"
        >
          <img src="/icon.svg" alt="" className="h-7 w-7 rounded-sm object-contain" />
          <span className="hidden font-serif text-base tracking-tight md:inline">SideBy</span>
        </Link>

        <nav className="pointer-events-auto absolute right-4 top-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
          <div className="flex max-w-[calc(100vw-5rem)] items-center gap-1 overflow-x-auto rounded-b-2xl border-x border-b border-white/[0.08] bg-black/95 px-1.5 py-2 shadow-[0_22px_55px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:max-w-[calc(100vw-1rem)] sm:gap-2 sm:px-3 md:gap-4 md:rounded-b-3xl md:px-5">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "whitespace-nowrap rounded-full px-2.5 py-2 text-[10px] font-semibold text-[#e1e0cc]/70 transition-colors hover:bg-white/[0.05] hover:text-[#e1e0cc] sm:px-3 sm:text-xs md:px-4 md:text-sm",
                  location.pathname === item.to && "bg-white/[0.07] text-[#e1e0cc]",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default MarketingNav;
