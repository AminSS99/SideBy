import React, { useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { GitCompareArrows, LayoutDashboard, Layers3, FolderKanban, Settings, LogOut, MessageSquare, Microscope, Database, Activity, CreditCard, Search, Terminal, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { CommandMenu } from "@/components/CommandMenu";
import { BrandFooter } from "@/components/brand/BrandFooter";

const navItems = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/chat", label: "AI Chat", icon: MessageSquare },
  { to: "/app/comparisons", label: "Comparisons", icon: GitCompareArrows },
  { to: "/app/research", label: "Research", icon: Microscope },
  { to: "/app/uploads", label: "Knowledge", icon: Database },
  { to: "/app/prompts", label: "Prompts", icon: Terminal },
  { to: "/app/analytics", label: "Analytics", icon: Activity },
  { to: "/app/team", label: "Team", icon: Users },
  { to: "/app/billing", label: "Billing", icon: CreditCard },
  { to: "/app/workspaces", label: "Workspaces", icon: Layers3 },
  { to: "/app/projects", label: "Projects", icon: FolderKanban },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

const AppShell = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const {
    activeWorkspace,
    error: workspaceError,
    isLoading: workspaceLoading,
  } = useWorkspace();
  const shellRef = useRef<HTMLDivElement>(null);
  const [commandOpen, setCommandOpen] = useState(false);

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
    <div ref={shellRef} className="min-h-screen bg-[#050505] text-white selection:bg-orange-500/30">
      <CommandMenu open={commandOpen} setOpen={setCommandOpen} />
      
      <div className="shell-header border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center border border-[#333] bg-[#111] font-serif text-xl text-[#fdfbf7]">
              S
            </div>
            <div>
              <a
                href={brand.url}
                className="font-serif text-lg tracking-tight text-white hover:text-orange-50 transition-colors"
              >
                {brand.productName}
              </a>
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.24em] text-white/35 sm:tracking-[0.3em]">
                Operated by {brand.companyName}
              </p>
            </div>
          </div>
          <div className="flex w-full items-center justify-between gap-3 lg:w-auto lg:justify-end">
            
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden lg:flex items-center gap-2 rounded-sm border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white/50 hover:bg-white/[0.08] hover:border-white/20 hover:text-white transition-all mr-4"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search or command...</span>
              <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-white/40">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>

            <div className="min-w-0 lg:text-right border-l border-white/10 pl-6 hidden lg:block">
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
              className="rounded-sm border border-transparent text-white/70 hover:bg-white/10 hover:border-white/10 hover:text-white transition-all"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 sm:py-8 lg:grid-cols-[220px_1fr] lg:gap-8 items-start">
        <aside className="shell-sidebar flex flex-col rounded-sm border border-white/10 bg-white/[0.02] p-2 sm:p-4 sticky top-28 lg:h-[calc(100vh-8rem)]">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:space-y-1 lg:overflow-visible no-scrollbar flex-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    "flex shrink-0 items-center gap-3 rounded-sm px-3 py-2.5 text-xs uppercase tracking-widest font-bold transition-all sm:px-4",
                    isActive
                      ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                      : "text-white/50 hover:bg-white/[0.05] border border-transparent hover:text-white",
                  ].join(" ")
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          
          <div className="hidden lg:block pt-6 mt-6 border-t border-white/10 px-2">
            <BrandFooter />
          </div>
        </aside>

        <main className="shell-main min-w-0 rounded-sm border border-white/10 bg-[#0a0a0a] p-6 sm:p-8 md:p-10 shadow-2xl">
          {workspaceError && (
            <div className="mb-6 rounded-sm border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
              {workspaceError}
            </div>
          )}
          <Outlet />
          
          {/* Mobile Footer since the sidebar footer is hidden on mobile */}
          <div className="mt-12 pt-6 border-t border-white/10 lg:hidden flex justify-center">
            <BrandFooter />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;