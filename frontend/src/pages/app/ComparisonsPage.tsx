import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  Globe2,
  Folder,
  GitCompareArrows,
  LoaderCircle,
  LockKeyhole,
  Search,
  Share2,
  Sparkles,
  Star,
  Tag,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { apiFetch, ApiError } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useProjects } from "@/contexts/ProjectsContext";
import { useAuth } from "@/contexts/AuthContext";
import { captureEvent } from "@/lib/posthog";
import { markFirstComparisonStarted } from "@/lib/onboardingAttribution";
import { EmptyState } from "@/components/EmptyState";
import { GlowCard } from "@/components/GlowCard";
import { ComparisonComposer } from "@/components/ComparisonComposer";
import { MultiOptionBracketComposer, type BracketRun } from "@/components/MultiOptionBracketComposer";
import { SUPPORTED_COMPARISON_CATEGORIES } from "@/lib/comparisonTaxonomy";


type ComparisonStatus = "running" | "completed" | "failed";
type ComparisonVisibility = "private" | "team" | "public";

type ComparisonHistoryItem = {
  id: string;
  query: string;
  slug: string;
  status: ComparisonStatus;
  visibility: ComparisonVisibility;
  isFavorited: boolean;
  folder: string | null;
  tags: string[];
  sourceCount: number;
  progress: number;
  updatedAt: string;
  summary: string | null;
  entityA: string | null;
  entityB: string | null;
  queryCategory?: string | null;
  taxonomyStatus?: string | null;
  safetyLevel?: string | null;
};

type ComparisonJob = {
  id: string;
  status: "running" | "completed" | "failed";
  progress: number;
  query: string;
  result: {
    slug: string;
    sourceCount: number;
    verdict: { summary: string };
    taxonomy?: { category: string; label: string; status: string; safetyLevel: string };
    entities: {
      a: { name: string };
      b: { name: string };
    };
  } | null;
  sourcesFound?: number;
  factsExtracted?: number;
  dimensionsScored?: number;
};


type FilterKey = "all" | "favorites" | ComparisonStatus | ComparisonVisibility;

const examples = SUPPORTED_COMPARISON_CATEGORIES
  .flatMap((category) => category.examples.slice(0, 1))
  .slice(0, 6);

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "favorites", label: "Favorites" },
  { key: "completed", label: "Completed" },
  { key: "running", label: "Running" },
  { key: "failed", label: "Failed" },
  { key: "public", label: "Public" },
  { key: "private", label: "Private" },
];

const formatTimestamp = (value: string) =>
  new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });

const statusIcon = {
  completed: CheckCircle2,
  running: LoaderCircle,
  failed: XCircle,
} satisfies Record<ComparisonStatus, React.ComponentType<{ className?: string }>>;

const statusClass = {
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  running: "bg-[#222] text-[#fdfbf7]/60 border-[#333]",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
} satisfies Record<ComparisonStatus, string>;

const visibilityIcon = {
  private: LockKeyhole,
  team: Sparkles,
  public: Globe2,
} satisfies Record<ComparisonVisibility, React.ComponentType<{ className?: string }>>;

const ComparisonsPage = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { activeProject } = useProjects();
  const [items, setItems] = useState<ComparisonHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [composerQuery, setComposerQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [isCreating, setIsCreating] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [organizingId, setOrganizingId] = useState<string | null>(null);


  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiFetch(buildApiUrl("/api/comparisons?limit=50"));
      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType?.includes("application/json")) {
        throw new Error("Unable to load saved comparisons.");
      }

      const data = (await res.json()) as { comparisons: ComparisonHistoryItem[] };
      setItems(data.comparisons);
    } catch (loadError) {
      setItems([]);
      setError(loadError instanceof Error ? loadError.message : "Unable to load saved comparisons.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Handle ?q= query param from landing page quick-start
  const [searchParams] = useSearchParams();
  const isFirstComparisonFlow = searchParams.get("first") === "1";
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setComposerQuery(q);
      // Clear the param so refresh doesn't re-trigger
      navigate(isFirstComparisonFlow ? "/app/comparisons?first=1" : "/app/comparisons", { replace: true });
    }
  }, [searchParams, navigate, isFirstComparisonFlow]);

  const hasRunningRef = useRef(false);

  useEffect(() => {
    hasRunningRef.current = items.some((item) => item.status === "running");
  }, [items]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (hasRunningRef.current) {
        void load();
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [load]);

  const animatedRef = useRef(false);

  useGSAP(() => {
    if (!isLoading && !animatedRef.current) {
      animatedRef.current = true;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(".comp-row", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out"
      });
    }
  }, [isLoading]);

  useGSAP(() => {
    if (!isFirstComparisonFlow || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.from(".first-flow-step", {
      y: 18,
      scale: 0.98,
      duration: 0.6,
      stagger: 0.08,
      ease: "back.out(1.25)",
      clearProps: "transform",
    });
  }, { scope: containerRef, dependencies: [isFirstComparisonFlow] });

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return items.filter((item) => {
      const filterMatch =
        filter === "all" ||
        (filter === "favorites" && item.isFavorited) ||
        item.status === filter ||
        item.visibility === filter;
      const textMatch =
        !needle ||
        item.query.toLowerCase().includes(needle) ||
        item.entityA?.toLowerCase().includes(needle) ||
        item.entityB?.toLowerCase().includes(needle) ||
        item.folder?.toLowerCase().includes(needle) ||
        item.tags.some((tag) => tag.toLowerCase().includes(needle));

      return filterMatch && textMatch;
    });
  }, [filter, items, query]);

  const counts = useMemo(
    () => {
      let favorites = 0;
      let completed = 0;
      let running = 0;
      let failed = 0;
      let publicCount = 0;
      let privateCount = 0;

      for (const item of items) {
        if (item.isFavorited) favorites++;
        if (item.status === "completed") completed++;
        if (item.status === "running") running++;
        if (item.status === "failed") failed++;
        if (item.visibility === "public") publicCount++;
        if (item.visibility === "private") privateCount++;
      }

      return {
        all: items.length,
        favorites,
        completed,
        running,
        failed,
        public: publicCount,
        private: privateCount,
      };
    },
    [items],
  );

  const publish = async (item: ComparisonHistoryItem) => {
    try {
      setPublishingId(item.id);
      const res = await apiFetch(buildApiUrl(`/api/comparisons/${item.id}/visibility`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" }),
      });
      if (!res.ok) {
        throw new Error("Unable to publish this comparison.");
      }

      setItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id
            ? { ...candidate, visibility: "public" }
            : candidate,
        ),
      );
      toast.success("Comparison published.", {
        description: "The public compare page is now available.",
      });
    } catch (publishError) {
      toast.error("Unable to publish this comparison.", {
        description: publishError instanceof Error ? publishError.message : "Please try again.",
      });
    } finally {
      setPublishingId(null);
    }
  };

  const organize = async (
    item: ComparisonHistoryItem,
    updates: Pick<ComparisonHistoryItem, "isFavorited" | "folder" | "tags">,
  ) => {
    try {
      setOrganizingId(item.id);
      const res = await apiFetch(buildApiUrl(`/api/comparisons/${item.id}/manage`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "organize", ...updates }),
      });
      if (!res.ok) throw new Error("Unable to save this organization.");
      const data = (await res.json()) as {
        comparison?: Pick<ComparisonHistoryItem, "isFavorited" | "folder" | "tags" | "updatedAt">;
      };
      if (!data.comparison) throw new Error("The saved organization was incomplete.");
      setItems((current) => current.map((candidate) =>
        candidate.id === item.id ? { ...candidate, ...data.comparison! } : candidate,
      ));
      captureEvent("comparison_organized_frontend", {
        comparison_id: item.id,
        is_favorited: data.comparison.isFavorited,
        has_folder: Boolean(data.comparison.folder),
        tag_count: data.comparison.tags.length,
      });
    } catch (organizeError) {
      toast.error("Unable to save organization.", {
        description: organizeError instanceof Error ? organizeError.message : "Please try again.",
      });
      throw organizeError;
    } finally {
      setOrganizingId(null);
    }
  };

  const startComparison = async (clean: string) => {
    try {
      setIsCreating(true);
      const res = await apiFetch(buildApiUrl("/api/comparisons"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: clean,
          workspaceId: activeWorkspace?.id,
          projectId: activeProject?.id,
        }),
      });
      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType?.includes("application/json")) {
        throw new Error("Unable to start comparison research.");
      }

      const job = (await res.json()) as ComparisonJob;
      const historyItem = jobToHistoryItem(job);
      setItems((current) => [historyItem, ...current.filter((item) => item.id !== job.id)]);
      setComposerQuery("");
      captureEvent("comparison_created_frontend", {
        query: clean,
        workspace_id: activeWorkspace?.id,
        project_id: activeProject?.id,
      });
      toast.success("Research started.", {
        description: "Opening the live comparison workbench.",
      });
      if (isFirstComparisonFlow && user?.id) markFirstComparisonStarted(user.id, job.id);
      navigate(`/app/comparisons/${job.id}${isFirstComparisonFlow ? "?first=1" : ""}`);
    } catch (creationError) {
      captureEvent("comparison_created_failed", {
        query: clean,
        error: creationError instanceof Error ? creationError.message : "unknown",
        status: creationError instanceof ApiError ? creationError.status : undefined,
      });
      if (creationError instanceof ApiError && creationError.status === 429) {
        toast.error("Daily limit reached.", {
          description: creationError.message || "Try again tomorrow.",
        });
      } else if (creationError instanceof ApiError && creationError.status === 422) {
        toast.error("Comparison needs a clearer shape.", {
          description: creationError.message,
        });
      } else {
        toast.error("Unable to start comparison research.", {
          description: creationError instanceof Error ? creationError.message : "Please try again.",
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const startMultiOptionBracket = async (options: string[], context: string): Promise<BracketRun[]> => {
    setIsCreating(true);
    try {
      const pairs = options.flatMap((left, index) => options.slice(index + 1).map((right) => `${left} vs ${right}${context.trim() ? ` for ${context.trim()}` : ""}`));
      const runs: BracketRun[] = [];
      for (const query of pairs) {
        const res = await apiFetch(buildApiUrl("/api/comparisons"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, workspaceId: activeWorkspace?.id, projectId: activeProject?.id }) });
        const data = await res.json() as ComparisonJob & { error?: string };
        if (!res.ok) throw new Error(data.error || `Unable to start ${query}.`);
        setItems((current) => [jobToHistoryItem(data), ...current.filter((item) => item.id !== data.id)]);
        runs.push({ id: data.id, query, status: data.status });
      }
      captureEvent("comparison_bracket_created", { option_count: options.length, pair_count: pairs.length });
      return runs;
    } finally { setIsCreating(false); }
  };

  return (
    <div ref={containerRef} className="space-y-6 sm:space-y-8">
      {isFirstComparisonFlow && (
        <section className="first-flow-step relative overflow-hidden rounded-[28px] border border-orange-300/20 bg-[radial-gradient(circle_at_90%_0%,rgba(217,70,239,.14),transparent_36%),linear-gradient(135deg,rgba(249,115,22,.12),rgba(255,255,255,.025))] p-5 sm:p-7">
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-orange-200"><Sparkles className="h-3.5 w-3.5" /> Your first decision</div>
              <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight text-white sm:text-4xl">Start with two real options. Add the context that could change the winner.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">SideBy will research both sides, surface the evidence, and carry the completed decision into your Snap workspace.</p>
            </div>
            <button type="button" onClick={() => document.getElementById("comparison-builder")?.scrollIntoView({ behavior: "smooth", block: "center" })} className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white px-5 text-xs font-bold text-black transition hover:bg-orange-100">
              Build comparison <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
          <div className="relative z-10 mt-6 grid grid-cols-3 gap-2">
            {["Discover", "Create", "Compare"].map((label, index) => (
              <div key={label} className={`first-flow-step rounded-xl border px-2 py-3 text-center text-[9px] font-bold uppercase tracking-[0.14em] ${index < 2 ? "border-emerald-300/15 bg-emerald-400/[0.055] text-emerald-200" : "border-orange-300/25 bg-orange-400/10 text-orange-100"}`}>
                {index < 2 ? <CheckCircle2 className="mx-auto mb-1.5 h-3.5 w-3.5" /> : <GitCompareArrows className="mx-auto mb-1.5 h-3.5 w-3.5" />}{label}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300">
            Comparisons
          </p>
          <h1 className="mt-2 font-serif text-3xl tracking-tight text-[#fffaf1] sm:text-4xl">
            Your decision library
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#fdfbf7]/55">
            Review every authenticated comparison job, publish completed reports, and reopen public pages without digging through browser history.
          </p>
        </div>

        <div id="comparison-builder" className="w-full scroll-mt-24 xl:max-w-xl xl:shrink-0">
          <ComparisonComposer
            key={composerQuery}
            initialQuery={composerQuery}
            onStart={startComparison}
            isCreating={isCreating}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Metric label="Total" value={counts.all} />
        <Metric label="Completed" value={counts.completed} />
        <Metric label="Favorites" value={counts.favorites} />
      </div>

      <MultiOptionBracketComposer onStart={startMultiOptionBracket} isCreating={isCreating} />

      <div className="rounded-2xl border border-white/[0.09] bg-white/[0.025] p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#fdfbf7]/30" />
            <input
              id="filter-comparisons-input"
              aria-label="Search previous comparisons"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by query or entity"
              className="h-12 w-full rounded-xl border border-white/10 bg-black/30 pl-11 pr-4 text-sm text-[#fdfbf7] outline-none transition-colors placeholder:text-white/25 focus:border-orange-400/40"
            />
          </div>

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar xl:mx-0 xl:px-0 xl:pb-0">
            {filters.map((item) => {
              const active = filter === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={[
                    "min-h-10 shrink-0 rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors",
                    active
                      ? "border-orange-300/20 bg-gradient-to-r from-orange-500 to-rose-500 text-white"
                      : "border-white/[0.08] bg-black/20 text-white/45 hover:border-white/15 hover:text-white",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-sm border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-500">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 rounded-sm border border-amber-500/40 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-amber-500/20"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-12 text-center text-sm text-[#fdfbf7]/50 animate-pulse">
          Loading saved comparisons...
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState 
          icon={Sparkles}
          title="No matching comparisons"
          description="Run a comparison from the homepage, then return here to manage its visibility and public report."
          glowColor="orange"
        />
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <ComparisonRow
              key={item.id}
              item={item}
              isPublishing={publishingId === item.id}
              isOrganizing={organizingId === item.id}
              onPublish={() => void publish(item)}
              onOrganize={(updates) => organize(item, updates)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: number }) => (
  <GlowCard containerClassName="comp-row !rounded-2xl !border-white/[0.08] !bg-white/[0.025]" className="p-3.5 sm:p-6">
    <p className="text-[8px] font-bold uppercase tracking-wider text-[#fdfbf7]/40 sm:text-[10px]">
      {label}
    </p>
    <p className="mt-2 font-serif text-2xl text-[#fdfbf7] sm:mt-3 sm:text-4xl">{value}</p>
  </GlowCard>
);

const jobToHistoryItem = (job: ComparisonJob): ComparisonHistoryItem => ({
  id: job.id,
  query: job.query,
  slug: job.result?.slug || slugFromQuery(job.query),
  status: job.status,
  visibility: "private",
  isFavorited: false,
  folder: null,
  tags: [],
  sourceCount: job.result?.sourceCount || 0,
  progress: job.progress,
  updatedAt: new Date().toISOString(),
  // The create endpoint can legitimately return an early, partial result
  // while the asynchronous research job is still enriching it. The detail
  // page fetches the complete job independently, so history construction
  // must not prevent navigation when these optional preview fields are absent.
  summary: job.result?.verdict?.summary || null,
  entityA: job.result?.entities?.a?.name || null,
  entityB: job.result?.entities?.b?.name || null,
  queryCategory: job.result?.taxonomy?.label || null,
  taxonomyStatus: job.result?.taxonomy?.status || null,
  safetyLevel: job.result?.taxonomy?.safetyLevel || null,
});

const slugFromQuery = (query: string) => {
  const [left, rest = "comparison"] = query.split(/\s+vs\.?\s+/i);
  const [right] = rest.split(/\s+for\s+/i);
  return `${left || "comparison"}-vs-${right || "target"}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const ComparisonRow = ({
  item,
  isPublishing,
  isOrganizing,
  onPublish,
  onOrganize,
}: {
  item: ComparisonHistoryItem;
  isPublishing: boolean;
  isOrganizing: boolean;
  onPublish: () => void;
  onOrganize: (updates: Pick<ComparisonHistoryItem, "isFavorited" | "folder" | "tags">) => Promise<void>;
}) => {
  const StatusIcon = statusIcon[item.status];
  const VisibilityIcon = visibilityIcon[item.visibility];
  const title = [item.entityA, item.entityB].filter(Boolean).join(" vs ") || item.query;
  const categoryLabel = item.queryCategory
    ? item.queryCategory.replace(/_/g, " ")
    : null;
  const [isEditingOrganization, setIsEditingOrganization] = useState(false);
  const [folderDraft, setFolderDraft] = useState(item.folder || "");
  const [tagsDraft, setTagsDraft] = useState(item.tags.join(", "));

  const saveOrganization = async () => {
    const tags = [...new Set(tagsDraft.split(",").map((tag) => tag.trim()).filter(Boolean))].slice(0, 8);
    await onOrganize({
      isFavorited: item.isFavorited,
      folder: folderDraft.trim() || null,
      tags,
    });
    setIsEditingOrganization(false);
    toast.success("Organization saved.");
  };

  return (
    <GlowCard containerClassName="comp-row !rounded-2xl !border-white/[0.08] !bg-white/[0.025]" className="p-5 sm:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest ${statusClass[item.status]}`}>
              <StatusIcon className={`h-3 w-3 ${item.status === "running" ? "animate-spin" : ""}`} />
              {item.status}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#333] bg-[#0c0b0a] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
              <VisibilityIcon className="h-3 w-3" />
              {item.visibility}
            </span>
            {categoryLabel && (
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-orange-300">
                {categoryLabel}
              </span>
            )}
            {item.folder && (
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#333] bg-[#0c0b0a] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
                <Folder className="h-3 w-3" />
                {item.folder}
              </span>
            )}
            {item.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-sm border border-[#333] bg-[#0c0b0a] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>

          <h2 className="mt-4 break-words font-serif text-2xl tracking-tight text-[#fffaf1]">
            {title}
          </h2>
          <p className="mt-2 break-words text-[10px] font-bold uppercase leading-5 tracking-wider text-[#fdfbf7]/30">{item.query}</p>

          {item.summary && (
            <p className="mt-4 line-clamp-2 max-w-4xl text-sm leading-relaxed text-[#fdfbf7]/70 border-l-2 border-orange-500 pl-4">
              {item.summary}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[9px] font-bold uppercase tracking-wider text-[#fdfbf7]/40">
            <span className="flex items-center gap-2">
              <Clock3 className="h-3 w-3" />
              {formatTimestamp(item.updatedAt)}
            </span>
            <span className="h-1 w-1 rounded-full bg-[#333]" />
            <span>{item.sourceCount} sources</span>
            <span className="h-1 w-1 rounded-full bg-[#333]" />
            <span>{item.progress}% complete</span>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2 sm:flex sm:flex-wrap sm:items-center lg:shrink-0 lg:justify-end">
          <Link
            to={`/app/comparisons/${item.id}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 text-[10px] font-bold uppercase tracking-wider text-white transition hover:brightness-110"
          >
            Review
          </Link>
          <button
            type="button"
            aria-label={item.isFavorited ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={item.isFavorited}
            onClick={() => void onOrganize({
              isFavorited: !item.isFavorited,
              folder: item.folder,
              tags: item.tags,
            })}
            disabled={isOrganizing}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${item.isFavorited ? "border-orange-500 bg-orange-500 text-white" : "border-white/10 bg-black/20 text-white/60 hover:border-orange-500 hover:text-orange-400"}`}
          >
            <Star className={`h-4 w-4 ${item.isFavorited ? "fill-current" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsEditingOrganization((open) => !open)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 text-[10px] font-bold uppercase tracking-wider text-white/65 transition-colors hover:border-white/20"
          >
            <Folder className="h-3.5 w-3.5" />
            Organize
          </button>
          {item.visibility === "public" ? (
            <Link
              to={`/compare/${item.slug}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/20 px-5 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:border-white/20"
            >
              Open Link
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onPublish}
              disabled={item.status !== "completed" || isPublishing}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-orange-500/25 bg-orange-500/[0.08] px-5 text-[10px] font-bold uppercase tracking-wider text-orange-300 transition-colors hover:bg-orange-500/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPublishing ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Share2 className="h-3.5 w-3.5" />
              )}
              Publish
            </button>
          )}
        </div>
      </div>
      {isEditingOrganization && (
        <div className="mt-6 grid gap-3 border-t border-[#2a2a2a] pt-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] md:items-end">
          <label className="grid gap-2 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
            Folder
            <input value={folderDraft} onChange={(event) => setFolderDraft(event.target.value)} maxLength={80} placeholder="e.g. Infrastructure" className="h-10 rounded-sm border border-[#333] bg-[#0c0b0a] px-3 text-sm font-normal normal-case tracking-normal text-[#fdfbf7] outline-none focus:border-orange-500" />
          </label>
          <label className="grid gap-2 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
            Tags
            <input value={tagsDraft} onChange={(event) => setTagsDraft(event.target.value)} placeholder="e.g. q3, migration (up to 8)" className="h-10 rounded-sm border border-[#333] bg-[#0c0b0a] px-3 text-sm font-normal normal-case tracking-normal text-[#fdfbf7] outline-none focus:border-orange-500" />
          </label>
          <button type="button" onClick={() => void saveOrganization()} disabled={isOrganizing} className="h-10 rounded-sm bg-orange-500 px-4 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-orange-400 disabled:opacity-50">
            {isOrganizing ? "Saving" : "Save"}
          </button>
        </div>
      )}
    </GlowCard>
  );
};

export default ComparisonsPage;
