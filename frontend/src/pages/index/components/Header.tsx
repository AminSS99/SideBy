import React from "react";
import { Link } from "react-router-dom";

const landingNavItems = [
  { label: "Features", to: "/features" },
  { label: "Docs", to: "/docs" },
  { label: "Workbench", to: "/app" },
];

export const Header = () => {
  return (
    <header className="sticky top-0 z-40 h-20 pointer-events-none">
      <div className="relative mx-auto h-full max-w-7xl px-4 sm:px-6">
        <Link
          to="/"
          className="pointer-events-auto absolute left-4 top-3 flex items-center gap-3 rounded-full border border-white/[0.08] bg-black/70 px-3 py-2 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-colors hover:border-white/15 sm:left-6"
        >
          <img src="/sideby.ico" alt="SideBy" className="h-8 w-8 object-contain rounded-sm transition-opacity group-hover:opacity-80" />
          <div className="hidden sm:block">
            <p className="font-serif text-sm tracking-tight text-[#fdfbf7]">SideBy</p>
            <p className="text-[8px] font-bold uppercase tracking-[0.22em] text-[#fdfbf7]/40">Research Engine</p>
          </div>
        </Link>

        <nav className="pointer-events-auto absolute left-1/2 top-0 hidden -translate-x-1/2 md:block">
          <div className="flex items-center gap-8 rounded-b-[1.75rem] border-x border-b border-white/[0.08] bg-black/85 px-8 py-3 shadow-[0_22px_55px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:gap-12 lg:px-10">
            {landingNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#fdfbf7]/55 transition-colors hover:text-[#fdfbf7]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <Link
          to="/app"
          className="pointer-events-auto absolute right-4 top-3 rounded-full border border-white/[0.1] bg-[#fdfbf7] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-black shadow-[0_18px_40px_rgba(0,0,0,0.35)] transition-all hover:bg-white active:scale-[0.98] sm:right-6"
        >
          Sign In
        </Link>
      </div>
    </header>
  );
};
