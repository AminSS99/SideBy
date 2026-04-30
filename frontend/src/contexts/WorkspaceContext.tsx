import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { WorkspaceRecord } from "@/lib/supabase/workspace";

interface WorkspaceContextValue {
  workspaces: WorkspaceRecord[];
  activeWorkspace: WorkspaceRecord | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, session, isLoading: authLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session || !user) {
      setWorkspaces([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const now = new Date().toISOString();
    const ownerName = user.fullName || user.email?.split("@")[0] || "SideBy";
    const slugBase = (user.email?.split("@")[0] || user.id)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);

    setWorkspaces([
      {
        id: `clerk-${user.id}`,
        owner_id: user.id,
        name: `${ownerName} Workspace`,
        slug: `${slugBase || "workspace"}-${user.id.slice(-6).toLowerCase()}`,
        plan: "free",
        created_at: now,
        updated_at: now,
      },
    ]);
    setError(null);
    setIsLoading(false);
  }, [session, user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void refresh();
  }, [authLoading, refresh]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      activeWorkspace: workspaces[0] ?? null,
      isLoading,
      error,
      refresh,
    }),
    [error, isLoading, refresh, workspaces],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider.");
  }

  return context;
};
