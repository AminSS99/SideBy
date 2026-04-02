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
import {
  createWorkspaceProject,
  listWorkspaceProjects,
  type ProjectRecord,
} from "@/lib/supabase/projects";

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
  const { user, session, isConfigured, isLoading: authLoading } = useAuth();
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
    if (!isConfigured || !session || !user || !activeWorkspace) {
      setProjects([]);
      setActiveProjectIdState(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const nextProjects = await listWorkspaceProjects(activeWorkspace.id);
      setProjects(nextProjects);

      const storageKey = buildProjectStorageKey(activeWorkspace.id);
      const storedProjectId =
        typeof window === "undefined"
          ? null
          : window.localStorage.getItem(storageKey);
      const nextActiveProjectId =
        nextProjects.find((project) => project.id === storedProjectId)?.id ??
        nextProjects[0]?.id ??
        null;

      setActiveProjectIdState(nextActiveProjectId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load project data from Supabase.",
      );
      setProjects([]);
      setActiveProjectIdState(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace, isConfigured, session, user]);

  const createProject = useCallback(async ({ name, description }: CreateProjectValues) => {
    if (!activeWorkspace || !user) {
      throw new Error("You need an active workspace before creating a project.");
    }

    const project = await createWorkspaceProject({
      workspaceId: activeWorkspace.id,
      createdBy: user.id,
      name: name.trim(),
      description,
    });

    setProjects((current) => [project, ...current]);
    persistActiveProjectId(project.id);
    setError(null);

    return project;
  }, [activeWorkspace, persistActiveProjectId, user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void refresh();
  }, [activeWorkspace?.id, authLoading, isConfigured, refresh, session, user?.id]);

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
