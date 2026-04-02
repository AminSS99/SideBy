import React, { useEffect, useState } from "react";
import { Clock3, FolderKanban, Layers3, Sparkles, Workflow } from "lucide-react";
import { brand } from "@/config/brand";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/contexts/ProjectsContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { listWorkspaceAiRuns, type AiRunRecord } from "@/lib/supabase/aiRuns";
import { Link } from "react-router-dom";

const formatRunTimestamp = (value: string) =>
  new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });

const DashboardHome = () => {
  const { user, isConfigured } = useAuth();
  const { activeWorkspace, error, isLoading, workspaces } = useWorkspace();
  const { activeProject, projects, isLoading: projectsLoading } = useProjects();
  const [recentRuns, setRecentRuns] = useState<AiRunRecord[]>([]);
  const [runsLoading, setRunsLoading] = useState(true);
  const [runsError, setRunsError] = useState<string | null>(null);
  const activeWorkspaceId = activeWorkspace?.id ?? null;

  useEffect(() => {
    if (!activeWorkspaceId || !isConfigured) {
      setRecentRuns([]);
      setRunsError(null);
      setRunsLoading(false);
      return;
    }

    let isMounted = true;

    const loadRuns = async () => {
      try {
        setRunsLoading(true);
        setRunsError(null);
        const nextRuns = await listWorkspaceAiRuns(activeWorkspaceId, 6);

        if (!isMounted) {
          return;
        }

        setRecentRuns(nextRuns);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setRecentRuns([]);
        setRunsError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load recent AI activity.",
        );
      } finally {
        if (isMounted) {
          setRunsLoading(false);
        }
      }
    };

    void loadRuns();

    return () => {
      isMounted = false;
    };
  }, [activeWorkspaceId, isConfigured]);

  const cards = [
    {
      title: "Workspaces",
      value: isLoading ? "..." : String(workspaces.length),
      description: activeWorkspace?.name || "No active workspace yet",
      icon: Layers3,
    },
    {
      title: "Projects",
      value: projectsLoading ? "..." : String(projects.length),
      description: activeProject?.name || "No active project selected",
      icon: FolderKanban,
    },
    {
      title: "Tracked AI runs",
      value: runsLoading ? "..." : String(recentRuns.length),
      description:
        recentRuns[0]?.title || "No persisted compare history in this workspace yet",
      icon: Workflow,
    },
    {
      title: "Platform state",
      value: isConfigured ? "Live" : "Scaffold",
      description: isConfigured
        ? "Supabase-backed product data is enabled"
        : "Supabase keys are still missing",
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-400">
          SaaS foundation
        </p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-tight">
          Welcome back to {brand.productName}
        </h1>
        <p className="mt-4 max-w-3xl text-white/60">
          {user?.email
            ? `Signed in as ${user.email}.`
            : "Your auth state is active."}{" "}
          This dashboard is the protected shell that the rest of the product
          will expand from.
        </p>
        {activeWorkspace && (
          <p className="mt-4 text-sm text-white/45">
            Active workspace:{" "}
            <span className="font-semibold text-white">
              {activeWorkspace.name}
            </span>
          </p>
        )}
        {!isConfigured && (
          <p className="mt-4 text-sm text-amber-300">
            Supabase keys are still missing, so this route is currently using
            scaffolded state only.
          </p>
        )}
        {error && <p className="mt-4 text-sm text-amber-300">{error}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-[28px] border border-white/10 bg-black/30 p-6"
          >
            <card.icon className="h-5 w-5 text-emerald-300" />
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-white/35">
              {card.title}
            </p>
            <h2 className="mt-3 text-3xl font-black text-white">{card.value}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-[28px] border border-white/10 bg-black/30 p-6">
        <h2 className="text-xl font-bold text-white">
          Workspace bootstrap status
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/55">
          {isLoading
            ? "Creating or loading your first workspace..."
            : `Loaded ${workspaces.length} workspace record(s) from Supabase.`}
        </p>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-black/30 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Recent compare history</h2>
            <p className="mt-2 text-sm text-white/55">
              The latest tracked AI runs from your active workspace.
            </p>
          </div>
          <Link
            to="/app/projects"
            className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300 transition-colors hover:text-emerald-200"
          >
            Manage projects
          </Link>
        </div>

        {runsError && (
          <p className="mt-4 text-sm text-amber-300">{runsError}</p>
        )}

        {runsLoading ? (
          <div className="mt-6 text-sm text-white/55">
            Loading recent AI activity...
          </div>
        ) : recentRuns.length === 0 ? (
          <div className="mt-6 rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] p-8">
            <p className="text-sm text-white/55">
              No compare runs have been persisted yet. Create a project in{" "}
              <Link to="/app/projects" className="text-emerald-300 underline underline-offset-4">
                Projects
              </Link>{" "}
              and run a comparison while signed in.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {recentRuns.map((run) => {
              const inputPayload = run.input_payload ?? {};
              const itemA =
                typeof inputPayload.itemA === "string" ? inputPayload.itemA : null;
              const itemB =
                typeof inputPayload.itemB === "string" ? inputPayload.itemB : null;
              const linkedProject =
                projects.find((project) => project.id === run.project_id)?.name ??
                "Workspace only";

              return (
                <div
                  key={run.id}
                  className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/[0.02] p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-lg font-bold text-white">
                      {run.title || [itemA, itemB].filter(Boolean).join(" vs ") || "Untitled run"}
                    </p>
                    <p className="mt-2 text-sm text-white/50">
                      {linkedProject} · {run.provider} · {run.model}
                    </p>
                    {run.output_summary && (
                      <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-relaxed text-white/60">
                        {run.output_summary}
                      </p>
                    )}
                  </div>

                  <div className="text-left md:text-right">
                    <span
                      className={[
                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
                        run.status === "completed"
                          ? "bg-emerald-300 text-black"
                          : run.status === "failed"
                            ? "bg-red-400/20 text-red-200"
                            : "bg-white/10 text-white/60",
                      ].join(" ")}
                    >
                      {run.status}
                    </span>
                    <div className="mt-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/35 md:justify-end">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatRunTimestamp(run.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
