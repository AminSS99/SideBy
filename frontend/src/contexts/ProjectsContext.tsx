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
import type { ProjectRecord } from "@/lib/supabase/projects";

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

const buildProjectStorageKey = (workspaceId: string) =>
  `sideby.active-project.${workspaceId}`;

export const ProjectsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, session, isLoading: authLoading } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const persistActiveProjectId = useCallback((projectId: string | null) => {
    setActiveProjectIdState(projectId);

    if (!activeWorkspace || typeof window === "undefined") {
      return;
    }

    const storageKey = buildProjectStorageKey(activeWorkspace.id);

    if (projectId) {
      window.localStorage.setItem(storageKey, projectId);
      return;
    }

    window.localStorage.removeItem(storageKey);
  }, [activeWorkspace]);

  const refresh = useCallback(async () => {
    if (!session || !user || !activeWorkspace) {
      setProjects([]);
      setActiveProjectIdState(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const storageKey = `sideby.projects.${activeWorkspace.id}`;
      const storedProjects = typeof window === "undefined"
        ? []
        : JSON.parse(window.localStorage.getItem(storageKey) || "[]");
      const nextProjects = Array.isArray(storedProjects)
        ? (storedProjects as ProjectRecord[])
        : [];
      setProjects(nextProjects);

      const activeStorageKey = buildProjectStorageKey(activeWorkspace.id);
      const storedProjectId =
        typeof window === "undefined"
          ? null
          : window.localStorage.getItem(activeStorageKey);
      const nextActiveProjectId =
        nextProjects.find((project) => project.id === storedProjectId)?.id ??
        nextProjects[0]?.id ??
        null;

      setActiveProjectIdState(nextActiveProjectId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load local project data.",
      );
      setProjects([]);
      setActiveProjectIdState(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace, session, user]);

  const createProject = useCallback(async ({ name, description }: CreateProjectValues) => {
    if (!activeWorkspace || !user) {
      throw new Error("You need an active workspace before creating a project.");
    }

    const now = new Date().toISOString();
    const project: ProjectRecord = {
      id: crypto.randomUUID(),
      workspace_id: activeWorkspace.id,
      created_by: user.id,
      name: name.trim(),
      description: description?.trim() || null,
      created_at: now,
      updated_at: now,
    };

    setProjects((current) => {
      const next = [project, ...current];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          `sideby.projects.${activeWorkspace.id}`,
          JSON.stringify(next),
        );
      }
      return next;
    });
    persistActiveProjectId(project.id);
    setError(null);

    return project;
  }, [activeWorkspace, persistActiveProjectId, user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void refresh();
  }, [activeWorkspace?.id, authLoading, refresh, session, user?.id]);

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
