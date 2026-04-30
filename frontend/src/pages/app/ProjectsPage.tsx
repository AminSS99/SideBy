import React, { useState } from "react";
import { FolderKanban, LoaderCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProjects } from "@/contexts/ProjectsContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const ProjectsPage = () => {
  const { activeWorkspace } = useWorkspace();
  const {
    projects,
    activeProject,
    createProject,
    error,
    isLoading,
    setActiveProjectId,
  } = useProjects();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("Project name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const project = await createProject({
        name,
        description,
      });
      setName("");
      setDescription("");
      toast.success("Project created.", {
        description: `${project.name} is now ready to receive tracked AI runs.`,
      });
    } catch (creationError) {
      toast.error("Failed to create project.", {
        description:
          creationError instanceof Error
            ? creationError.message
            : "Check your workspace state and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-400">
          Projects
        </p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-tight">
          Real project records
        </h1>
        <p className="mt-4 max-w-3xl text-white/60">
          Create projects inside your active workspace and use them to group persisted
          compare runs before richer orchestration lands.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form
          className="rounded-[28px] border border-white/10 bg-black/30 p-6"
          onSubmit={handleCreateProject}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-300">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create project</h2>
              <p className="mt-1 text-sm text-white/50">
                {activeWorkspace
                  ? `Projects are created inside ${activeWorkspace.name}.`
                  : "Load a workspace first to create projects."}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">
                Project name
              </label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Compare launch readiness"
                className="h-12 border-white/10 bg-black/30 text-white"
                disabled={!activeWorkspace || isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Track the first persisted compare and dashboard history flows."
                className="min-h-32 border-white/10 bg-black/30 text-white"
                disabled={!activeWorkspace || isSubmitting}
              />
            </div>

            <Button
              type="submit"
              disabled={!activeWorkspace || isSubmitting}
              className="h-12 w-full rounded-2xl bg-white text-black hover:bg-white/90"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Creating project...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create project
                </>
              )}
            </Button>

            {error && (
              <p className="text-sm text-amber-300">
                {error}
              </p>
            )}
          </div>
        </form>

        <div className="rounded-[28px] border border-white/10 bg-black/30 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Workspace projects</h2>
              <p className="mt-1 text-sm text-white/50">
                Select the active project to attach future compare runs.
              </p>
            </div>
            <div className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              {projects.length} total
            </div>
          </div>

          {isLoading ? (
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/55">
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="mt-6 rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
              <FolderKanban className="mx-auto h-10 w-10 text-white/25" />
              <h3 className="mt-4 text-lg font-semibold text-white">
                No projects yet
              </h3>
              <p className="mt-2 text-sm text-white/50">
                Create the first project so compare runs can start landing in something
                more structured than the workspace root.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {projects.map((project) => {
                const isActive = project.id === activeProject?.id;

                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setActiveProjectId(project.id)}
                    className={[
                      "w-full rounded-[28px] border p-6 text-left transition-colors",
                      isActive
                        ? "border-emerald-400/50 bg-emerald-400/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {project.name}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-white/55">
                          {project.description || "No description added yet."}
                        </p>
                      </div>
                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
                          isActive
                            ? "bg-emerald-300 text-black"
                            : "bg-white/10 text-white/50",
                        ].join(" ")}
                      >
                        {isActive ? "Active" : "Available"}
                      </span>
                    </div>

                    <p className="mt-4 text-xs uppercase tracking-[0.25em] text-white/35">
                      Created {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;
