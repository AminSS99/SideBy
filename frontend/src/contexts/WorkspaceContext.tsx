import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";

export interface WorkspaceRecord {
  id: string;
  ownerId: string;
  ownerType: "user" | "org";
  name: string;
  slug: string;
  plan: "free" | "pro" | "team" | "business";
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceContextValue {
  workspaces: WorkspaceRecord[];
  activeWorkspace: WorkspaceRecord | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading: authLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session) {
      setWorkspaces([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await apiFetch(buildApiUrl("/api/workspaces"));
      if (!res.ok) {
        throw new Error("Unable to load workspaces.");
      }

      const data = (await res.json()) as { workspaces: WorkspaceRecord[] };
      setWorkspaces(data.workspaces);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspaces.");
      setWorkspaces([]);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

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
