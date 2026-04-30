import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { GitCompareArrows, Layers3, FolderKanban, Settings, LogOut, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const navItems = [
  { to: "/app", label: "Overview", icon: Layers3, end: true },
  { to: "/app/chat", label: "AI Chat", icon: MessageSquare },
  { to: "/app/comparisons", label: "Comparisons", icon: GitCompareArrows },
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

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth/sign-in", { replace: true });
    } catch (error) {
      console.error("Failed to sign out.", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <a
              href={brand.url}
              className="text-2xl font-black tracking-tight text-white"
            >
              {brand.productName}
            </a>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white/35 sm:text-xs sm:tracking-[0.3em]">
              Operated by {brand.companyName}
            </p>
          </div>
          <div className="flex w-full items-center justify-between gap-3 lg:w-auto lg:justify-end">
            <div className="min-w-0 lg:text-right">
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
              className="rounded-full text-white/70 hover:bg-white/10 hover:text-white"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 sm:py-8 lg:grid-cols-[220px_1fr] lg:gap-6">
        <aside className="rounded-[24px] border border-white/10 bg-white/5 p-2 sm:p-4 lg:rounded-[28px]">
          <nav className="flex gap-2 overflow-x-auto lg:block lg:space-y-2 lg:overflow-visible">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    "flex shrink-0 items-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors sm:gap-3 sm:px-4",
                    isActive
                      ? "bg-emerald-400 text-black"
                      : "text-white/65 hover:bg-white/10 hover:text-white",
                  ].join(" ")
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:p-6 md:p-8 lg:rounded-[32px]">
          {workspaceError && (
            <div className="mb-6 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
              {workspaceError}
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;