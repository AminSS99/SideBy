import React from "react";
import { Link } from "react-router-dom";

const navItems = [
  { label: "SideBy", to: "/" },
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Docs", to: "/docs" },
  { label: "Workbench", to: "/app" },
];

export const MarketingNav = () => {
  return (
    <header className="sticky top-0 z-40 flex h-16 justify-center pointer-events-none">
      <nav className="pointer-events-auto">
        <div className="flex items-center gap-3 rounded-b-2xl border-x border-b border-white/[0.08] bg-black px-4 py-2 shadow-[0_22px_55px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:gap-6 md:gap-12 md:rounded-b-3xl md:px-8 lg:gap-14">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="whitespace-nowrap text-[10px] font-medium text-[#e1e0cc]/80 transition-colors hover:text-[#e1e0cc] sm:text-xs md:text-sm"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
};

export default MarketingNav;
