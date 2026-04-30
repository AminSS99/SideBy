import React, { useEffect, useState } from "react";
import { Clock3, ExternalLink, FolderKanban, Layers3, Sparkles, Workflow } from "lucide-react";
import { brand } from "@/config/brand";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/contexts/ProjectsContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { Link } from "react-router-dom";

type ComparisonHistoryItem = {
  id: string;
  query: string;
  slug: string;
  status: "running" | "completed" | "failed";
  visibility: "private" | "team" | "public";
  sourceCount: number;
  progress: number;
  updatedAt: string;
  summary: string | null;
  entityA: string | null;
  entityB: string | null;
};

const formatTimestamp = (value: string) =>
  new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });

const DashboardHome = () => {
  const { user, isConfigured } = useAuth();
  const { activeWorkspace, error, isLoading, workspaces } = useWorkspace();
  const { activeProject, projects, isLoading: projectsLoading } = useProjects();
  const [comparisons, setComparisons] = useState<ComparisonHistoryItem[]>([]);
  const [comparisonsLoading, setComparisonsLoading] = useState(true);
  const [comparisonsError, setComparisonsError] = useState<string | null>(null);
  const activeWorkspaceId = activeWorkspace?.id ?? null;

  useEffect(() => {
    if (!activeWorkspaceId || !isConfigured) {
      setComparisons([]);
      setComparisonsError(null);
      setComparisonsLoading(false);
      return;
    }

    let mounted = true;

    const loadComparisons = async () => {
      try {
        setComparisonsLoading(true);
        setComparisonsError(null);
        const res = await apiFetch(buildApiUrl("/api/comparisons/list?limit=6"));
        if (!res.ok) {
          throw new Error("Unable to load comparison history.");
        }

        const data = (await res.json()) as { comparisons: ComparisonHistoryItem[] };
        if (mounted) {
          setComparisons(data.comparisons);
        }
      } catch (loadError) {
        if (mounted) {
          setComparisons([]);
          setComparisonsError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load comparison history.",
          );
        }
      } finally {
        if (mounted) {
          setComparisonsLoading(false);
        }
      }
    };

    void loadComparisons();

    return () => {
      mounted = false;
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
      title: "Comparisons",
      value: comparisonsLoading ? "..." : String(comparisons.length),
      description:
        comparisons[0]?.query || "No persisted compare history yet",
      icon: Workflow,
    },
    {
      title: "Platform state",
      value: isConfigured ? "Live" : "Scaffold",
      description: isConfigured
        ? "Clerk-backed private beta access is enabled"
        : "Clerk keys are still missing",
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
            Clerk keys are still missing, so this route is currently using
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
            : `Loaded ${workspaces.length} workspace record(s) for this beta session.`}
        </p>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-black/30 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Recent compare history</h2>
            <p className="mt-2 text-sm text-white/55">
              The latest comparison jobs attached to your Clerk beta account.
            </p>
          </div>
          <Link
            to="/app/comparisons"
            className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300 transition-colors hover:text-emerald-200"
          >
            View all
          </Link>
        </div>

        {comparisonsError && (
          <p className="mt-4 text-sm text-amber-300">{comparisonsError}</p>
        )}

        {comparisonsLoading ? (
          <div className="mt-6 text-sm text-white/55">
            Loading comparison history...
          </div>
        ) : comparisons.length === 0 ? (
          <div className="mt-6 rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] p-8">
            <p className="text-sm text-white/55">
              No comparisons have been persisted yet. Run a source-backed comparison while signed in and it will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {comparisons.map((comparison) => {
              return (
                <div
                  key={comparison.id}
                  className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/[0.02] p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-lg font-bold text-white">
                      {[comparison.entityA, comparison.entityB].filter(Boolean).join(" vs ") || comparison.query}
                    </p>
                    <p className="mt-2 text-sm text-white/50">
                      {comparison.visibility} · {comparison.sourceCount} sources · {comparison.progress}% complete
                    </p>
                    {comparison.summary && (
                      <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-relaxed text-white/60">
                        {comparison.summary}
                      </p>
                    )}
                  </div>

                  <div className="text-left md:text-right">
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <span
                        className={[
                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
                          comparison.status === "completed"
                            ? "bg-emerald-300 text-black"
                            : comparison.status === "failed"
                              ? "bg-red-400/20 text-red-200"
                              : "bg-white/10 text-white/60",
                        ].join(" ")}
                      >
                        {comparison.status}
                      </span>
                      {comparison.visibility === "public" && (
                        <Link
                          to={`/compare/${comparison.slug}`}
                          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/55 transition-colors hover:border-white/25 hover:text-white"
                        >
                          Open
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/35 md:justify-end">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatTimestamp(comparison.updatedAt)}
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
