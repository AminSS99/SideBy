import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Docs", to: "/docs" },
];

export const MarketingNav = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between rounded-2xl border border-white/[0.1] bg-[#090807]/80 px-3 shadow-[0_18px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:px-4">
        <Link
          to="/"
          aria-label="SideBy home"
          className="group inline-flex min-h-11 items-center gap-2.5 rounded-xl px-2 text-[#fffaf1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl border border-orange-300/20 bg-gradient-to-br from-orange-400/15 to-fuchsia-500/10">
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.22),transparent_45%)]" />
            <img src="/icon.svg" alt="" className="relative h-7 w-7 object-contain transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110" />
          </span>
          <span className="font-serif text-lg tracking-tight">SideBy</span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white",
                location.pathname === item.to && "bg-white/[0.07] text-white",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/app"
            className="hidden min-h-11 items-center gap-2 rounded-xl border border-orange-300/20 bg-gradient-to-br from-orange-400 to-orange-600 px-4 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(249,115,22,.2)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(249,115,22,.32)] sm:inline-flex"
          >
            Open workbench <ArrowUpRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            aria-label="Mobile navigation"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-2 max-w-7xl rounded-2xl border border-white/10 bg-[#0b0908]/95 p-2 shadow-2xl backdrop-blur-2xl md:hidden"
          >
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className="flex min-h-12 items-center rounded-xl px-4 text-sm font-medium text-white/70 hover:bg-white/[0.06] hover:text-white">
                {item.label}
              </Link>
            ))}
            <Link to="/app" className="mt-1 flex min-h-12 items-center justify-between rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-4 text-sm font-semibold text-white sm:hidden">
              Open workbench <ArrowUpRight className="h-4 w-4" />
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default MarketingNav;
