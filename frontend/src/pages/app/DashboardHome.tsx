import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Clock3,
  ExternalLink,
  FolderKanban,
  Layers3,
  Sparkles,
  Workflow,
  Plus,
  UploadCloud,
  UserPlus,
  Activity,
  ArrowRight,
  Zap,
  ShieldCheck,
  Scale,
  GitCompareArrows
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { brand } from "@/config/brand";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/contexts/ProjectsContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { GlowCard } from "@/components/GlowCard";
import { captureEvent } from "@/lib/posthog";

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

const onboardingExamples = [
  "React vs Vue for a SaaS",
  "Supabase vs Firebase",
  "Cursor vs Windsurf",
  "Notion vs Linear",
  "ChatGPT Plus vs Claude Pro",
];

const DashboardHome = () => {
  const navigate = useNavigate();
  const { user, isConfigured } = useAuth();
  const { activeWorkspace, error, isLoading, workspaces } = useWorkspace();
  const { activeProject, projects, isLoading: projectsLoading } = useProjects();
  const [comparisons, setComparisons] = useState<ComparisonHistoryItem[]>([]);
  const [comparisonsLoading, setComparisonsLoading] = useState(true);
  const [comparisonsError, setComparisonsError] = useState<string | null>(null);
  const activeWorkspaceId = activeWorkspace?.id ?? null;
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!comparisonsLoading && !isLoading && !projectsLoading) {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const tl = gsap.timeline();
      const listItems = gsap.utils.toArray(".dash-list-item");
      tl.from(".dash-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
        .from(".dash-action", { y: 20, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }, "-=0.6")
        .from(".dash-card", { y: 20, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }, "-=0.4");
      if (listItems.length) {
        tl.from(listItems, { x: -20, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }, "-=0.4");
      }

      // Staggered number counters
      gsap.utils.toArray<HTMLElement>(".stat-number").forEach((el) => {
        const val = parseFloat(el.getAttribute("data-value") || "0");
        if (!isNaN(val) && isFinite(val) && val > 0) {
          gsap.fromTo(el,
            { innerHTML: "0" },
            {
              innerHTML: val.toString(),
              duration: 1.2,
              ease: "power2.out",
              snap: { innerHTML: 1 },
            }
          );
        }
      });
    }
  }, [comparisonsLoading, isLoading, projectsLoading]);

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
        const res = await apiFetch(buildApiUrl("/api/comparisons?limit=5"));
        if (!res.ok) throw new Error("Unable to load comparison history.");

        const data = (await res.json()) as { comparisons: ComparisonHistoryItem[] };
        if (mounted) setComparisons(data.comparisons);
      } catch (loadError) {
        if (mounted) {
          setComparisons([]);
          setComparisonsError(loadError instanceof Error ? loadError.message : "Unable to load history.");
        }
      } finally {
        if (mounted) setComparisonsLoading(false);
      }
    };

    void loadComparisons();
    return () => { mounted = false; };
  }, [activeWorkspaceId, isConfigured]);

  const stats = [
    { title: "Workspaces", value: isLoading ? "-" : workspaces.length, desc: activeWorkspace?.name || "None", icon: Layers3, color: "text-blue-400" },
    { title: "Projects", value: projectsLoading ? "-" : projects.length, desc: activeProject?.name || "No active project", icon: FolderKanban, color: "text-emerald-400" },
    { title: "Comparisons", value: comparisonsLoading ? "-" : comparisons.length, desc: "Total historical runs", icon: Workflow, color: "text-orange-400" },
    { title: "Platform", value: isConfigured ? "Live" : "Setup", desc: isConfigured ? "Services connected" : "Missing config", icon: Sparkles, color: "text-purple-400" },
  ];

  return (
    <div ref={containerRef} className="max-w-6xl space-y-6 sm:space-y-8">
      <div className="dash-header relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-orange-500/[0.09] via-[#111]/80 to-fuchsia-500/[0.06] p-5 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-orange-500/10 blur-[70px]" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300">
            Decision workspace
          </p>
          <h1 className="mt-3 max-w-2xl font-serif text-4xl tracking-tight text-[#fdfbf7] sm:text-5xl">
            What are we deciding today, {user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'Researcher'}?
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#fdfbf7]/50">
            Start with two options. SideBy researches the evidence, scores the tradeoffs, and gives your team a cited recommendation.
          </p>
        </div>
        
        {/* Activity Summary */}
        <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-sm">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 mb-1">Total Runs</p>
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              {comparisonsLoading ? (
                <span className="text-xs text-[#fdfbf7]/50">Loading...</span>
              ) : (
                <>
                  <span className="font-serif text-xl text-[#fdfbf7]">{comparisons.length}</span>
                  <span className="text-xs text-[#fdfbf7]/50">comparisons</span>
                </>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-[1.35fr_1fr_1fr]">
          <Link to="/app/comparisons" className="dash-action group col-span-2 flex items-center justify-between gap-4 overflow-hidden rounded-3xl border border-orange-400/20 bg-gradient-to-r from-orange-500/15 via-rose-500/10 to-fuchsia-500/10 p-5 transition-all hover:-translate-y-0.5 hover:border-orange-400/45 sm:p-6 lg:col-span-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-400/25 bg-orange-400/15 text-orange-300 transition-colors group-hover:bg-orange-400/25">
              <Plus className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-orange-200 transition-colors">New comparison</h3>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-[#fdfbf7]/40">Research two options</p>
            </div>
            <ArrowRight className="h-4 w-4 text-orange-300 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link to="/app/uploads" className="dash-action group flex min-h-36 flex-col items-start justify-between gap-3 rounded-3xl border border-white/[0.08] bg-white/[0.035] p-5 transition-all hover:-translate-y-0.5 hover:border-blue-400/35 hover:bg-blue-500/[0.06]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-[#fdfbf7] transition-colors group-hover:border-blue-400/30 group-hover:text-blue-300">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#fdfbf7] transition-colors group-hover:text-blue-300">Upload sources</h3>
              <p className="mt-1 text-[9px] uppercase tracking-widest text-[#fdfbf7]/35">Build your evidence base</p>
            </div>
          </Link>

          <Link to="/app/team" className="dash-action group flex min-h-36 flex-col items-start justify-between gap-3 rounded-3xl border border-white/[0.08] bg-white/[0.035] p-5 transition-all hover:-translate-y-0.5 hover:border-fuchsia-400/35 hover:bg-fuchsia-500/[0.06]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-[#fdfbf7] transition-colors group-hover:border-fuchsia-400/30 group-hover:text-fuchsia-300">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#fdfbf7] transition-colors group-hover:text-fuchsia-300">Invite team</h3>
              <p className="mt-1 text-[9px] uppercase tracking-widest text-[#fdfbf7]/35">Decide together</p>
            </div>
          </Link>
        </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <GlowCard key={stat.title} containerClassName="dash-card" className="rounded-3xl p-4 sm:p-6">
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
            <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
              {stat.title}
            </p>
            <h2 className="mt-2 font-serif text-3xl text-[#fdfbf7]">
              {typeof stat.value === "number" ? (
                <span className="stat-number inline-block" data-value={stat.value}>
                  {stat.value}
                </span>
              ) : (
                stat.value
              )}
            </h2>
            <p className="mt-2 text-[10px] uppercase tracking-widest font-bold text-[#fdfbf7]/30 truncate">
              {stat.desc}
            </p>
          </GlowCard>
        ))}
      </div>

      {/* Recent History */}
      <div className="dash-card rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5 sm:p-8">
        <div className="flex items-center justify-between gap-4 border-b border-[#2a2a2a] pb-6">
          <div>
            <h2 className="font-serif text-2xl text-[#fdfbf7]">Recent Comparisons</h2>
            <p className="mt-1 text-[10px] text-[#fdfbf7]/40 uppercase tracking-widest font-bold">
              Your comparison history
            </p>
          </div>
          <Link
            to="/app/comparisons"
            className="hidden sm:flex rounded-sm border border-[#333] bg-[#0c0b0a] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60 transition-colors hover:border-[#555] hover:text-[#fdfbf7]"
          >
            View all history
          </Link>
        </div>

        {comparisonsError && (
          <div className="mt-6 rounded-sm border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-500">
            {comparisonsError}
          </div>
        )}

        {comparisonsLoading ? (
          <div className="mt-8 py-12 text-sm text-[#fdfbf7]/30 text-center font-serif italic animate-pulse">
            Loading research records...
          </div>
        ) : comparisons.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-white/10 bg-black/20 p-6 text-center sm:p-12">
              <div className="mb-8">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-sm border border-orange-500/20 bg-orange-500/10 text-orange-400">
                  <GitCompareArrows className="h-8 w-8" />
                </div>
                <h3 className="font-serif text-2xl text-[#fdfbf7] mb-3">
                  Create your first comparison
                </h3>
              <p className="text-sm text-[#fdfbf7]/50 max-w-md mx-auto leading-relaxed">
                Enter any two products, technologies, or topics and let SideBy research them side by side with cited sources.
              </p>
            </div>

            <div className="mb-8">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#fdfbf7]/30 mb-4">
                Try an example
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
                {onboardingExamples.map((example) => (
                  <button
                    key={example}
                    onClick={() => {
                      captureEvent("onboarding_example_clicked", { example });
                      navigate(`/app/comparisons?q=${encodeURIComponent(example)}`);
                    }}
                    className="rounded-full border border-[#333] bg-[#111] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/50 transition-all hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-400"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 max-w-2xl mx-auto">
              <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-5 text-center">
                <Scale className="h-5 w-5 text-[#fdfbf7]/30 mx-auto mb-3" />
                <p className="text-xs font-bold text-[#fdfbf7] mb-1">Unbiased</p>
                <p className="text-[10px] text-[#fdfbf7]/40">Facts from official docs</p>
              </div>
              <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-5 text-center">
                <Zap className="h-5 w-5 text-orange-400 mx-auto mb-3" />
                <p className="text-xs font-bold text-[#fdfbf7] mb-1">Instant</p>
                <p className="text-[10px] text-[#fdfbf7]/40">Full matrix in 30s</p>
              </div>
              <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-5 text-center">
                <ShieldCheck className="h-5 w-5 text-emerald-400 mx-auto mb-3" />
                <p className="text-xs font-bold text-[#fdfbf7] mb-1">Source-backed</p>
                <p className="text-[10px] text-[#fdfbf7]/40">Every claim cited</p>
              </div>
            </div>

            <Link
              to="/app/comparisons"
              className="inline-flex items-center gap-2 mt-8 rounded-sm bg-[#fdfbf7] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#e0e0e0]"
            >
              Start comparing <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="mt-6 divide-y divide-[#2a2a2a]">
            {comparisons.map((comparison) => {
              return (
                <div
                  key={comparison.id}
                  className="dash-list-item flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between group"
                >
                  <div className="min-w-0">
                    <Link to={`/app/comparisons/${comparison.id}`} className="font-serif text-lg text-[#fdfbf7] group-hover:text-orange-400 transition-colors truncate block">
                      {[comparison.entityA, comparison.entityB].filter(Boolean).join(" vs ") || comparison.query}
                    </Link>
                    <div className="mt-2 flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
                      <span>{comparison.visibility}</span>
                      <span className="h-1 w-1 rounded-full bg-[#333]" />
                      <span>{comparison.sourceCount} sources</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 shrink-0">
                    <div className="flex flex-col md:items-end gap-1.5">
                      <span
                        className={[
                          "inline-flex rounded-sm px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest border",
                          comparison.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : comparison.status === "failed"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-[#222] text-[#fdfbf7]/60 border-[#333]",
                        ].join(" ")}
                      >
                        {comparison.status}
                      </span>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/30">
                        <Clock3 className="h-3 w-3" />
                        {formatTimestamp(comparison.updatedAt)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      {comparison.visibility === "public" && (
                        <Link
                          to={`/compare/${comparison.slug}`}
                          className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#333] bg-[#0c0b0a] text-[#fdfbf7]/50 hover:text-white hover:border-[#555] transition-colors"
                          title="View Public Page"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      )}
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
