import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Layers3, FolderKanban, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const navItems = [
  { to: "/app", label: "Overview", icon: Layers3, end: true },
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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <a
              href={brand.url}
              className="text-2xl font-black tracking-tight text-white"
            >
              {brand.productName}
            </a>
            <p className="text-xs uppercase tracking-[0.3em] text-white/35">
              Operated by {brand.companyName}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-white">
                {user?.email ?? "Guest"}
              </p>
              <p className="text-xs text-white/40">
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
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-[28px] border border-white/10 bg-white/5 p-4">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
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

        <main className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
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
