import React, { useEffect, useState, useRef } from "react";
import { Clock3, ExternalLink, FolderKanban, Layers3, Sparkles, Workflow } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
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

const GlowCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden rounded-sm border border-[#2a2a2a] bg-[#111] p-6 hover:border-[#444] transition-colors group ${className}`}
    >
      <div 
        className="pointer-events-none absolute -inset-px rounded-sm opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(400px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(234, 88, 12, 0.15), transparent 40%)`
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

const DashboardHome = () => {
  const { user, isConfigured } = useAuth();
  const { activeWorkspace, error, isLoading, workspaces } = useWorkspace();
  const { activeProject, projects, isLoading: projectsLoading } = useProjects();
  const [comparisons, setComparisons] = useState<ComparisonHistoryItem[]>([]);
  const [comparisonsLoading, setComparisonsLoading] = useState(true);
  const [comparisonsError, setComparisonsError] = useState<string | null>(null);
  const activeWorkspaceId = activeWorkspace?.id ?? null;
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!comparisonsLoading) {
      gsap.from(".dash-card", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out"
      });
      
      gsap.from(".dash-list-item", {
        x: -20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.2
      });
    }
  }, [comparisonsLoading]);

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
    <div ref={containerRef} className="space-y-10">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
          SaaS foundation
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[#fdfbf7] tracking-tight">
          Welcome back to {brand.productName}
        </h1>
        <p className="mt-4 max-w-3xl text-[#fdfbf7]/60 leading-relaxed">
          {user?.email
            ? `Signed in as ${user.email}.`
            : "Your auth state is active."}{" "}
          This dashboard is the protected shell that the rest of the product
          will expand from.
        </p>
        {activeWorkspace && (
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-[#fdfbf7]/40">
            Active workspace:{" "}
            <span className="text-[#fdfbf7]">
              {activeWorkspace.name}
            </span>
          </p>
        )}
        {!isConfigured && (
          <p className="mt-4 text-sm text-amber-500">
            Clerk keys are still missing, so this route is currently using
            scaffolded state only.
          </p>
        )}
        {error && <p className="mt-4 text-sm text-amber-500">{error}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <GlowCard key={card.title} className="dash-card">
            <card.icon className="h-5 w-5 text-orange-500" />
            <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
              {card.title}
            </p>
            <h2 className="mt-2 font-serif text-3xl text-[#fdfbf7]">{card.value}</h2>
            <p className="mt-2 text-xs leading-relaxed text-[#fdfbf7]/50">
              {card.description}
            </p>
          </GlowCard>
        ))}
      </div>

      <div className="dash-card rounded-sm border border-[#2a2a2a] bg-[#111] p-8">
        <div className="flex items-center justify-between gap-4 border-b border-[#2a2a2a] pb-6">
          <div>
            <h2 className="font-serif text-2xl text-[#fdfbf7]">Recent compare history</h2>
            <p className="mt-1 text-xs text-[#fdfbf7]/50 uppercase tracking-widest font-bold">
              Attached to your beta account
            </p>
          </div>
          <Link
            to="/app/comparisons"
            className="rounded-sm border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-orange-400 transition-colors hover:bg-orange-500/20"
          >
            View all
          </Link>
        </div>

        {comparisonsError && (
          <p className="mt-6 text-sm text-amber-500">{comparisonsError}</p>
        )}

        {comparisonsLoading ? (
          <div className="mt-8 text-sm text-[#fdfbf7]/50 text-center animate-pulse">
            Loading comparison history...
          </div>
        ) : comparisons.length === 0 ? (
          <div className="mt-8 rounded-sm border border-dashed border-[#333] bg-[#0c0b0a] p-10 text-center">
            <p className="text-sm text-[#fdfbf7]/50">
              No comparisons have been persisted yet. Run a source-backed comparison while signed in and it will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-6 divide-y divide-[#2a2a2a]">
            {comparisons.map((comparison) => {
              return (
                <div
                  key={comparison.id}
                  className="dash-list-item flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between group"
                >
                  <div>
                    <p className="font-serif text-xl text-[#fdfbf7] group-hover:text-orange-400 transition-colors">
                      {[comparison.entityA, comparison.entityB].filter(Boolean).join(" vs ") || comparison.query}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
                      <span>{comparison.visibility}</span>
                      <span className="h-1 w-1 rounded-full bg-[#333]" />
                      <span>{comparison.sourceCount} sources</span>
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <div className="flex flex-wrap items-center gap-3 md:justify-end">
                      <span
                        className={[
                          "inline-flex rounded-sm px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest border",
                          comparison.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : comparison.status === "failed"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-[#222] text-[#fdfbf7]/60 border-[#333]",
                        ].join(" ")}
                      >
                        {comparison.status}
                      </span>
                      {comparison.visibility === "public" && (
                        <Link
                          to={`/compare/${comparison.slug}`}
                          className="inline-flex items-center gap-1.5 rounded-sm border border-[#333] bg-[#111] px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/70 transition-colors hover:border-[#555] hover:text-[#fdfbf7]"
                        >
                          Link
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/30 md:justify-end">
                      <Clock3 className="h-3 w-3" />
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