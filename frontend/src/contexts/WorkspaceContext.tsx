import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  ensureWorkspaceBootstrap,
  listMemberWorkspaces,
  type WorkspaceRecord,
} from "@/lib/supabase/workspace";

interface WorkspaceContextValue {
  workspaces: WorkspaceRecord[];
  activeWorkspace: WorkspaceRecord | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, session, isConfigured, isLoading: authLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!isConfigured || !session || !user) {
      setWorkspaces([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await ensureWorkspaceBootstrap(user);
      const nextWorkspaces = await listMemberWorkspaces();
      setWorkspaces(nextWorkspaces);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load workspace data. Apply the Supabase migration first.",
      );
      setWorkspaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void refresh();
  }, [authLoading, isConfigured, session, user?.id]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      activeWorkspace: workspaces[0] ?? null,
      isLoading,
      error,
      refresh,
    }),
    [error, isLoading, workspaces],
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
