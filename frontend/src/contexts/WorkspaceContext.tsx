import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";

const ACTIVE_WORKSPACE_KEY = "sideby.activeWorkspaceId";
const WORKSPACE_CACHE_KEY = "sideby.workspace.cache";
const WORKSPACE_CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

interface CachedWorkspaces {
  workspaces: WorkspaceRecord[];
  activeWorkspaceId: string | null;
  timestamp: number;
}

export interface WorkspaceRecord {
  id: string;
  ownerId: string;
  ownerType: "user" | "org";
  name: string;
  slug: string;
  plan: "free" | "pro" | "team" | "business";
  snapsolveWorkspaceId: string | null;
  snapsolveWorkspaceSlug: string | null;
  snapsolveWorkspaceStatus: string | null;
  snapsolveSyncError: string | null;
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

function readCachedWorkspaces(): WorkspaceRecord[] | null {
  try {
    const raw = localStorage.getItem(WORKSPACE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedWorkspaces;
    if (Date.now() - parsed.timestamp > WORKSPACE_CACHE_TTL_MS) {
      localStorage.removeItem(WORKSPACE_CACHE_KEY);
      return null;
    }
    return parsed.workspaces;
  } catch {
    return null;
  }
}

function writeCachedWorkspaces(workspaces: WorkspaceRecord[], activeWorkspaceId: string | null) {
  try {
    if (workspaces.length > 0) {
      const cache: CachedWorkspaces = {
        workspaces,
        activeWorkspaceId,
        timestamp: Date.now(),
      };
      localStorage.setItem(WORKSPACE_CACHE_KEY, JSON.stringify(cache));
    } else {
      localStorage.removeItem(WORKSPACE_CACHE_KEY);
    }
  } catch {
    // Storage might be unavailable
  }
}

function clearCachedWorkspaces() {
  try {
    localStorage.removeItem(WORKSPACE_CACHE_KEY);
  } catch {
    // Ignore
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const WorkspaceProvider = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading: authLoading } = useAuth();
  const { pathname } = useLocation();
  const sessionUserId = session?.userId ?? null;
  const shouldLoadWorkspaces = pathname === "/onboarding" || pathname === "/app" || pathname.startsWith("/app/");
  const cachedWorkspaces = useMemo(() => readCachedWorkspaces(), []);
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>(cachedWorkspaces ?? []);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(readStoredWorkspaceId);
  const [isLoading, setIsLoading] = useState(!cachedWorkspaces);
  const [error, setError] = useState<string | null>(null);
  const fetchAttemptRef = useRef(0);

  const applyWorkspaceData = useCallback((data: WorkspaceRecord[]) => {
    setWorkspaces(data);

    const storedId = readStoredWorkspaceId();
    const validStored = data.find((w) => w.id === storedId);
    if (validStored) {
      setActiveWorkspaceIdState(storedId);
      writeCachedWorkspaces(data, storedId);
    } else if (data.length > 0) {
      setActiveWorkspaceIdState(data[0].id);
      storeWorkspaceId(data[0].id);
      writeCachedWorkspaces(data, data[0].id);
    } else {
      setActiveWorkspaceIdState(null);
      storeWorkspaceId(null);
      writeCachedWorkspaces([], null);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!sessionUserId) {
      setWorkspaces([]);
      setError(null);
      setIsLoading(false);
      clearCachedWorkspaces();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Keep workspace retry behavior at the provider level to avoid request amplification.
      const res = await apiFetch(buildApiUrl("/api/workspaces"), {}, { retries: 0 });
      const data = (await res.json()) as { workspaces: WorkspaceRecord[] };
      applyWorkspaceData(data.workspaces);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspaces.");
      setWorkspaces([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionUserId, applyWorkspaceData]);

  useEffect(() => {
    if (authLoading) return;
    if (!sessionUserId) {
      setWorkspaces([]);
      setIsLoading(false);
      clearCachedWorkspaces();
      return;
    }
    if (!shouldLoadWorkspaces) {
      // Workspace data is only needed by authenticated app/onboarding routes.
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchWithRetry = async () => {
      setIsLoading(true);
      setError(null);

      for (let attempt = 0; attempt < 4; attempt++) {
        if (cancelled) return;
        try {
          // Keep workspace retry behavior at the provider level to avoid request amplification.
          const res = await apiFetch(buildApiUrl("/api/workspaces"), {}, { retries: 0 });
          const data = (await res.json()) as { workspaces: WorkspaceRecord[] };
          if (cancelled) return;

          if (data.workspaces.length > 0 || attempt === 3) {
            applyWorkspaceData(data.workspaces);
            setIsLoading(false);
            fetchAttemptRef.current = attempt;
            return;
          }

          await delay(800 + attempt * 400);
        } catch (err) {
          if (cancelled) return;
          if (attempt === 3) {
            setError(err instanceof Error ? err.message : "Failed to load workspaces.");
            setWorkspaces([]);
            setIsLoading(false);
            return;
          }
          await delay(800 + attempt * 400);
        }
      }
    };

    void fetchWithRetry();

    return () => {
      cancelled = true;
    };
  }, [sessionUserId, authLoading, shouldLoadWorkspaces, applyWorkspaceData]);

  const setActiveWorkspaceId = useCallback((id: string | null) => {
    setActiveWorkspaceIdState(id);
    storeWorkspaceId(id);
    writeCachedWorkspaces(workspaces, id);
  }, [workspaces]);

  const activeWorkspace = useMemo(() => {
    return workspaces.find((w) => w.id === activeWorkspaceId) ?? null;
  }, [workspaces, activeWorkspaceId]);

  const needsOnboarding = useMemo(() => {
    if (!shouldLoadWorkspaces) return false;
    if (authLoading || isLoading) return false;
    if (!sessionUserId) return false;
    return workspaces.length === 0;
  }, [authLoading, isLoading, sessionUserId, shouldLoadWorkspaces, workspaces.length]);

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
