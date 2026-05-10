import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";

const ACTIVE_WORKSPACE_KEY = "sideby.activeWorkspaceId";

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
  setActiveWorkspaceId: (id: string | null) => void;
  needsOnboarding: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

function readStoredWorkspaceId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_WORKSPACE_KEY);
  } catch {
    return null;
  }
}

function storeWorkspaceId(id: string | null) {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
    }
  } catch {
    // Storage might be unavailable
  }
}

export const WorkspaceProvider = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading: authLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(readStoredWorkspaceId);
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

      // Validate stored active workspace ID
      const storedId = readStoredWorkspaceId();
      const validStored = data.workspaces.find((w) => w.id === storedId);
      if (validStored) {
        setActiveWorkspaceIdState(storedId);
      } else if (data.workspaces.length > 0) {
        // Fallback to first workspace if stored one no longer exists
        setActiveWorkspaceIdState(data.workspaces[0].id);
        storeWorkspaceId(data.workspaces[0].id);
      } else {
        setActiveWorkspaceIdState(null);
        storeWorkspaceId(null);
      }
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

  const setActiveWorkspaceId = useCallback((id: string | null) => {
    setActiveWorkspaceIdState(id);
    storeWorkspaceId(id);
  }, []);

  const activeWorkspace = useMemo(() => {
    return workspaces.find((w) => w.id === activeWorkspaceId) ?? null;
  }, [workspaces, activeWorkspaceId]);

  // If user is authenticated but has no workspaces, they need onboarding
  const needsOnboarding = useMemo(() => {
    if (authLoading || isLoading) return false;
    if (!session) return false;
    return workspaces.length === 0;
  }, [authLoading, isLoading, session, workspaces.length]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      activeWorkspace,
      isLoading,
      error,
      refresh,
      setActiveWorkspaceId,
      needsOnboarding,
    }),
    [activeWorkspace, error, isLoading, needsOnboarding, refresh, setActiveWorkspaceId, workspaces],
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
