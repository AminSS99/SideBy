import React, { useRef, useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GitCompareArrows, LayoutDashboard, Layers3, FolderKanban, Settings, 
  LogOut, MessageSquare, Microscope, Database, Activity, CreditCard, 
  Search, Terminal, Users, Menu, X, AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { CommandMenu } from "@/components/CommandMenu";
import { BrandFooter } from "@/components/brand/BrandFooter";
import { AmbientOrbs } from "@/components/AmbientOrbs";

const navItems = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/chat", label: "AI Chat", icon: MessageSquare },
  { to: "/app/comparisons", label: "Comparisons", icon: GitCompareArrows },
  { to: "/app/research", label: "Research", icon: Microscope },
  { to: "/app/uploads", label: "Knowledge Base", icon: Database },
  { to: "/app/prompts", label: "Prompt Studio", icon: Terminal },
  { to: "/app/analytics", label: "Analytics", icon: Activity },
  { to: "/app/quality", label: "Quality", icon: AlertCircle },
  { to: "/app/team", label: "Team", icon: Users },
  { to: "/app/billing", label: "Billing", icon: CreditCard },
  { to: "/app/workspaces", label: "Workspaces", icon: Layers3 },
  { to: "/app/projects", label: "Projects", icon: FolderKanban },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const {
    activeWorkspace,
    error: workspaceError,
    isLoading: workspaceLoading,
  } = useWorkspace();
  const shellRef = useRef<HTMLDivElement>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <div ref={shellRef} className="min-h-screen bg-[#050505] text-white selection:bg-orange-500/30 relative flex flex-col">
      <AmbientOrbs />
      <CommandMenu open={commandOpen} setOpen={setCommandOpen} />
      
      <div className="shell-header border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-white/70 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link to="/" className="flex items-center gap-4 group">
              <img src="/sideby.ico" alt="SideBy" className="h-9 w-9 object-contain group-hover:opacity-80 transition-all" />
              <div className="hidden sm:block">
                <span className="font-serif text-lg tracking-tight text-white group-hover:text-orange-50 transition-colors">
                  {brand.productName}
                </span>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.24em] text-white/35">
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
              <p className="truncate text-xs text-white/40">
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

      <div className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 gap-4 px-4 py-5 sm:px-6 sm:py-8 lg:grid-cols-[220px_1fr] lg:gap-8 items-start">
        {/* Desktop Sidebar */}
        <aside className="shell-sidebar hidden lg:flex flex-col rounded-sm border border-white/10 bg-white/[0.02] backdrop-blur-md p-4 sticky top-28 h-[calc(100vh-8rem)]">
          <nav className="flex flex-col space-y-1 overflow-y-auto no-scrollbar flex-1">
            {navItems.map((item) => (
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
                className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm lg:hidden"
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
                    <div className="flex h-8 w-8 items-center justify-center border border-[#333] bg-[#111] font-serif text-sm text-[#fdfbf7]">
                      S
                    </div>
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
                  {navItems.map((item) => (
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

        <main className="shell-main min-w-0 w-full rounded-sm border border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md p-4 sm:p-8 md:p-10 shadow-2xl flex-1 flex flex-col">
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
    </div>
  );
};

export default AppShell;
