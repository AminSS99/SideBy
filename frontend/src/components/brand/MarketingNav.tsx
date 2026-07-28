import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpenText, CircleDollarSign, House, Sparkles, UsersRound } from "lucide-react";
import { TubelightNavbar, type TubelightNavItem } from "@/components/ui/tubelight-navbar";

const navItems: TubelightNavItem[] = [
  { name: "Home", url: "/", icon: House },
  { name: "Features", url: "/features", icon: Sparkles },
  { name: "Pricing", url: "/pricing", icon: CircleDollarSign },
  { name: "Docs", url: "/docs", icon: BookOpenText },
  { name: "About", url: "/about", icon: UsersRound },
];

export const MarketingNav = () => {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050403]/75 backdrop-blur-2xl">
        <div className="mx-auto flex h-[4.75rem] w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            aria-label="SideBy home"
            className="group inline-flex min-h-11 items-center gap-3 rounded-lg text-[#fffaf1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#050403]"
          >
            <span className="relative h-8 w-8 shrink-0 overflow-hidden" aria-hidden="true">
              <img
                src="/sideby.ico?v=20260728-real"
                alt=""
                className="absolute -left-[26px] -top-[22px] h-[84px] w-[84px] max-w-none object-contain transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              />
            </span>
            <span className="font-serif text-[1.35rem] tracking-[-0.025em]">SideBy</span>
          </Link>

          <Link
            to="/app"
            aria-label="Open workbench"
            className="group inline-flex min-h-11 items-center gap-3 rounded-full border border-white/[0.11] bg-white/[0.055] p-1.5 text-[0.8125rem] font-semibold tracking-[0.01em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_12px_40px_rgba(0,0,0,.22)] transition duration-300 hover:border-orange-300/25 hover:bg-white/[0.085] sm:pl-5"
          >
            <span className="hidden sm:inline">Open workbench</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-[0_8px_24px_rgba(249,115,22,.3)] transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      </header>
      <TubelightNavbar items={navItems} />
    </>
  );
};

export default MarketingNav;
