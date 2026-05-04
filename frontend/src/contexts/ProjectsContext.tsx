import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";

export interface ProjectRecord {
  id: string;
  workspaceId: string;
  createdBy: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateProjectValues {
  name: string;
  description?: string;
}

interface ProjectsContextValue {
  projects: ProjectRecord[];
  activeProject: ProjectRecord | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createProject: (values: CreateProjectValues) => Promise<ProjectRecord>;
  setActiveProjectId: (projectId: string | null) => void;
}

const ProjectsContext = createContext<ProjectsContextValue | undefined>(undefined);

export const ProjectsProvider = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading: authLoading } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const persistActiveProjectId = useCallback((projectId: string | null) => {
    setActiveProjectIdState(projectId);
  }, []);

  const refresh = useCallback(async () => {
    if (!session || !activeWorkspace) {
      setProjects([]);
      setActiveProjectIdState(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await apiFetch(
        buildApiUrl(`/api/projects?workspaceId=${encodeURIComponent(activeWorkspace.id)}`),
      );
      if (!res.ok) {
        throw new Error("Unable to load projects.");
      }

      const data = (await res.json()) as { projects: ProjectRecord[] };
      setProjects(data.projects);

      // Auto-select first project if none selected
      if (!activeProjectId && data.projects.length > 0) {
        setActiveProjectIdState(data.projects[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects.");
      setProjects([]);
      setActiveProjectIdState(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace, activeProjectId, session]);

  const createProject = useCallback(async ({ name, description }: CreateProjectValues) => {
    if (!activeWorkspace) {
      throw new Error("You need an active workspace before creating a project.");
    }

    const res = await apiFetch(buildApiUrl("/api/projects"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: activeWorkspace.id,
        name,
        description,
      }),
    });

    if (!res.ok) {
      const errorData = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(errorData.error || "Failed to create project.");
    }

    const data = (await res.json()) as { project: ProjectRecord };
    setProjects((current) => [data.project, ...current]);
    setActiveProjectIdState(data.project.id);
    setError(null);

    return data.project;
  }, [activeWorkspace]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void refresh();
  }, [activeWorkspace?.id, authLoading, refresh, session]);

  const activeProject =
    projects.find((project) => project.id === activeProjectId) ?? null;

  const value = useMemo<ProjectsContextValue>(
    () => ({
      projects,
      activeProject,
      isLoading,
      error,
      refresh,
      createProject,
      setActiveProjectId: persistActiveProjectId,
    }),
    [activeProject, createProject, error, isLoading, persistActiveProjectId, projects, refresh],
  );

  return (
    <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectsContext);

  if (!context) {
    throw new Error("useProjects must be used within a ProjectsProvider.");
  }

  return context;
};
