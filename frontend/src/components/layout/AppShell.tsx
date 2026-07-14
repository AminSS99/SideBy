import React, { useRef, useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation, Navigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitCompareArrows, Layers3, FolderKanban, Settings,
  LogOut, MessageSquare, Microscope, Database, Activity, CreditCard,
  Search, Terminal, Users, Menu, X, ChevronDown, Clock3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { CommandMenu } from "@/components/CommandMenu";
import { BrandFooter } from "@/components/brand/BrandFooter";

import { usePageTitle } from "@/hooks/usePageTitle";

const primaryNavItems = [
  { to: "/app/comparisons", label: "Compare", icon: GitCompareArrows },
  { to: "/app", label: "History", icon: Clock3, end: true },
  { to: "/app/uploads", label: "Sources", icon: Database },
  { to: "/app/team", label: "Team", icon: Users },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

const advancedNavItems = [
  { to: "/app/chat", label: "AI Chat", icon: MessageSquare },
  { to: "/app/research", label: "Research", icon: Microscope },
  { to: "/app/prompts", label: "Prompts", icon: Terminal },
  { to: "/app/analytics", label: "Analytics", icon: Activity },
  { to: "/app/billing", label: "Billing", icon: CreditCard },
  { to: "/app/workspaces", label: "Workspaces", icon: Layers3 },
  { to: "/app/projects", label: "Projects", icon: FolderKanban },
];

const AppShell = () => {
  usePageTitle("Dashboard");
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const {
    activeWorkspace,
    error: workspaceError,
    isLoading: workspaceLoading,
    needsOnboarding,
  } = useWorkspace();
  const shellRef = useRef<HTMLDivElement>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useGSAP(() => {
    const tl = gsap.timeline();
    
    tl.from(".shell-header", {
      y: -20,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    })
    .from(".shell-sidebar", {
      x: -20,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.6")
    .from(".shell-main", {
      y: 20,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.6")
    .from(".shell-bottom-nav", {
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: "back.out(1.2)"
    }, "-=0.6");
  }, { scope: shellRef });

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth/sign-in", { replace: true });
    } catch (error) {
      console.error("Failed to sign out.", error);
    }
  };

  // Redirect new users without workspaces to onboarding
  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div ref={shellRef} className="min-h-screen bg-[#050505] text-white selection:bg-orange-500/30 relative flex flex-col">
      <CommandMenu open={commandOpen} setOpen={setCommandOpen} />

      <div className="shell-header border-b border-white/10 bg-black/60 sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-white/70 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link to="/" className="flex items-center gap-4 group">
              <img src="/icon.svg" alt="SideBy" className="h-9 w-9 object-contain rounded-sm group-hover:opacity-80 transition-all" />
              <div className="hidden sm:block">
                <span className="font-serif text-lg tracking-tight text-white group-hover:text-orange-50 transition-colors">
                  {brand.productName}
                </span>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.24em] text-white/60">
                  Operated by {brand.companyName}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCommandOpen(true)}
              className="flex items-center gap-2 rounded-sm border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white/50 hover:bg-white/[0.08] hover:border-white/20 hover:text-white transition-all sm:mr-4"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-white/40 ml-2">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>

            <div className="min-w-0 text-right border-l border-white/10 pl-6 hidden lg:block">
              <p className="text-sm font-semibold text-white">
                {user?.email ?? "Guest"}
              </p>
              <p className="truncate text-xs text-white/60">
                {workspaceLoading
                  ? "Loading workspace..."
                  : activeWorkspace?.name || brand.operatedByLine}
              </p>
            </div>
            <Button
              variant="ghost"
              className="rounded-sm border border-transparent text-white/70 hover:bg-white/10 hover:border-white/10 hover:text-white transition-all hidden sm:flex"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 gap-4 px-4 py-5 sm:px-6 sm:py-8 lg:grid-cols-[220px_1fr] lg:gap-8 items-start pb-24 lg:pb-8">
        {/* Desktop Sidebar */}
        <aside className="shell-sidebar hidden lg:flex flex-col rounded-sm border border-white/10 bg-[#0a0a0a] p-4 sticky top-28 h-[calc(100vh-8rem)]">
          <nav className="flex flex-col space-y-1 overflow-y-auto no-scrollbar flex-1">
            {primaryNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    "relative flex shrink-0 items-center gap-3 rounded-sm px-4 py-2.5 text-xs uppercase tracking-widest font-bold transition-all group overflow-hidden",
                    isActive
                      ? "text-orange-400"
                      : "text-white/50 hover:text-white",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute inset-0 bg-orange-500/10 border border-orange-500/20 rounded-sm z-0" />
                    )}
                    <div className="absolute inset-0 bg-white/[0.05] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out z-0" />
                    <item.icon className="relative z-10 h-4 w-4 shrink-0" />
                    <span className="relative z-10">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}

            <div className="pt-4 mt-2">
              <button
                onClick={() => setAdvancedOpen(!advancedOpen)}
                className="flex w-full items-center justify-between rounded-sm px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-white/60 hover:text-white/80 transition-colors"
              >
                <span>Advanced</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {advancedOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1 space-y-1">
                      {advancedNavItems.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) =>
                            [
                              "relative flex shrink-0 items-center gap-3 rounded-sm px-4 py-2 text-xs uppercase tracking-widest font-bold transition-all group overflow-hidden",
                              isActive
                                ? "text-orange-400"
                                : "text-white/35 hover:text-white/70",
                            ].join(" ")
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && (
                                <div className="absolute inset-0 bg-orange-500/10 border border-orange-500/20 rounded-sm z-0" />
                              )}
                              <div className="absolute inset-0 bg-white/[0.03] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out z-0" />
                              <item.icon className="relative z-10 h-3.5 w-3.5 shrink-0" />
                              <span className="relative z-10">{item.label}</span>
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
          
          <div className="pt-6 mt-6 border-t border-white/10 px-2">
            <BrandFooter />
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 z-[60] bg-black/80 lg:hidden"
              />
              <motion.aside 
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="fixed inset-y-0 left-0 z-[70] w-[280px] bg-[#0c0b0a] border-r border-[#2a2a2a] shadow-2xl flex flex-col lg:hidden"
              >
                <div className="p-4 flex items-center justify-between border-b border-[#2a2a2a]">
                  <div className="flex items-center gap-3">
                    <img src="/icon.svg" alt="SideBy" className="h-8 w-8 object-contain rounded-sm" />
                    <span className="font-serif text-base tracking-tight text-white">{brand.productName}</span>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-white/50 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="p-4 border-b border-[#2a2a2a] bg-[#111]/50">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.email ?? "Guest"}
                  </p>
                  <p className="truncate text-[10px] uppercase tracking-widest font-bold text-white/40 mt-1">
                    {activeWorkspace?.name || "Workspace"}
                  </p>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                  {primaryNavItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-sm px-4 py-3 text-xs uppercase tracking-widest font-bold transition-all ${
                          isActive
                            ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                            : "text-white/60 hover:bg-[#1a1a1a] hover:text-white border border-transparent"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}

                  <div className="pt-3 mt-2">
                    <button
                      onClick={() => setAdvancedOpen(!advancedOpen)}
                      className="flex w-full items-center justify-between rounded-sm px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-white/60 hover:text-white/80 transition-colors"
                    >
                      <span>Advanced</span>
                      <ChevronDown className={`h-3 w-3 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
                    </button>

                    {advancedOpen && (
                      <div className="mt-1 space-y-1">
                        {advancedNavItems.map((item) => (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                              `flex items-center gap-3 rounded-sm px-4 py-2.5 text-xs uppercase tracking-widest font-bold transition-all ${
                                isActive
                                  ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                  : "text-white/40 hover:bg-[#1a1a1a] hover:text-white/70 border border-transparent"
                              }`
                            }
                          >
                            <item.icon className="h-3.5 w-3.5 shrink-0" />
                            <span>{item.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                </nav>

                <div className="p-4 border-t border-[#2a2a2a]">
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-sm border border-[#333] bg-[#111] text-white/70 hover:bg-[#1a1a1a] hover:border-[#444] hover:text-white transition-all mb-4"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </Button>
                  <BrandFooter className="justify-center" />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <main className="shell-main min-w-0 w-full rounded-sm border border-white/10 bg-[#0a0a0a] p-4 sm:p-8 md:p-10 shadow-2xl flex-1 flex flex-col pb-24 lg:pb-10">
          {workspaceError && (
            <div className="mb-6 rounded-sm border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
              {workspaceError}
            </div>
          )}
          
          <Outlet />
          
          <div className="mt-12 pt-6 border-t border-white/10 lg:hidden flex justify-center pb-4">
            <BrandFooter />
          </div>
        </main>
      </div>

      {/* Floating PWA Mobile Bottom Navigation */}
      <div className="shell-bottom-nav lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] h-16 bg-black/85 border border-white/10 rounded-2xl flex items-center justify-around px-2 shadow-[0_8px_32px_rgba(0,0,0,0.65)] z-50">
        <NavLink
          to="/app/comparisons"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-widest transition-all ${
              isActive ? "text-orange-400" : "text-white/40 hover:text-white"
            }`
          }
        >
          <GitCompareArrows className="h-5 w-5" />
          <span>Compare</span>
        </NavLink>

        <NavLink
          to="/app"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-widest transition-all ${
              isActive ? "text-orange-400" : "text-white/40 hover:text-white"
            }`
          }
        >
          <Clock3 className="h-5 w-5" />
          <span>History</span>
        </NavLink>

        <NavLink
          to="/app/uploads"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-widest transition-all ${
              isActive ? "text-orange-400" : "text-white/40 hover:text-white"
            }`
          }
        >
          <Database className="h-5 w-5" />
          <span>Sources</span>
        </NavLink>

        <NavLink
          to="/app/team"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-widest transition-all ${
              isActive ? "text-orange-400" : "text-white/40 hover:text-white"
            }`
          }
        >
          <Users className="h-5 w-5" />
          <span>Team</span>
        </NavLink>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-all"
        >
          <Menu className="h-5 w-5" />
          <span>More</span>
        </button>
      </div>
    </div>
  );
};

export default AppShell;
