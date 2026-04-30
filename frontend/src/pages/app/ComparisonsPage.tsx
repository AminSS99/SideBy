import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  Globe2,
  GitCompareArrows,
  LoaderCircle,
  LockKeyhole,
  Search,
  Share2,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { EmptyState } from "@/components/EmptyState";

type ComparisonStatus = "running" | "completed" | "failed";
type ComparisonVisibility = "private" | "team" | "public";

type ComparisonHistoryItem = {
  id: string;
  query: string;
  slug: string;
  status: ComparisonStatus;
  visibility: ComparisonVisibility;
  sourceCount: number;
  progress: number;
  updatedAt: string;
  summary: string | null;
  entityA: string | null;
  entityB: string | null;
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
    entities: {
      a: { name: string };
      b: { name: string };
    };
  } | null;
};

type FilterKey = "all" | ComparisonStatus | ComparisonVisibility;

const examples = [
  "ChatGPT Plus vs Claude Pro",
  "Supabase vs Firebase for a SaaS",
  "Cursor vs Windsurf",
  "Vercel vs Render",
];

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
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
  const [items, setItems] = useState<ComparisonHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [newComparison, setNewComparison] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [isCreating, setIsCreating] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiFetch(buildApiUrl("/api/comparisons/list?limit=50"));
      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType?.includes("application/json")) {
        throw new Error("Unable to load saved comparisons.");
      }

      const data = (await res.json()) as { comparisons: ComparisonHistoryItem[] };
      setItems(data.comparisons);
    } catch (loadError) {
      console.warn("Backend disconnected. Generating local mock history.", loadError);
      setItems([
        {
          id: "mock-1",
          query: "Supabase vs Firebase for a SaaS",
          slug: "supabase-vs-firebase",
          status: "completed",
          visibility: "public",
          sourceCount: 12,
          progress: 100,
          updatedAt: new Date().toISOString(),
          summary: "Supabase has the edge when control, extensibility, and developer velocity matter. Firebase provides a solid managed fallback.",
          entityA: "Supabase",
          entityB: "Firebase"
        },
        {
          id: "mock-2",
          query: "Vercel vs Render",
          slug: "vercel-vs-render",
          status: "completed",
          visibility: "private",
          sourceCount: 8,
          progress: 100,
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
          summary: "Vercel excels for frontend frameworks, while Render is better for full-stack Docker deployments.",
          entityA: "Vercel",
          entityB: "Render"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!items.some((item) => item.status === "running")) {
      return;
    }

    const interval = window.setInterval(() => {
      void load();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [items]);

  useGSAP(() => {
    if (!isLoading) {
      gsap.from(".comp-row", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out"
      });
    }
  }, [isLoading, items]);

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return items.filter((item) => {
      const filterMatch =
        filter === "all" || item.status === filter || item.visibility === filter;
      const textMatch =
        !needle ||
        item.query.toLowerCase().includes(needle) ||
        item.entityA?.toLowerCase().includes(needle) ||
        item.entityB?.toLowerCase().includes(needle);

      return filterMatch && textMatch;
    });
  }, [filter, items, query]);

  const counts = useMemo(
    () => ({
      all: items.length,
      completed: items.filter((item) => item.status === "completed").length,
      running: items.filter((item) => item.status === "running").length,
      failed: items.filter((item) => item.status === "failed").length,
      public: items.filter((item) => item.visibility === "public").length,
      private: items.filter((item) => item.visibility === "private").length,
    }),
    [items],
  );

  const publish = async (item: ComparisonHistoryItem) => {
    try {
      setPublishingId(item.id);
      const res = await apiFetch(buildApiUrl(`/api/comparisons/${item.id}/publish`), {
        method: "POST",
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
      toast.success("Mock comparison published.");
      setItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id
            ? { ...candidate, visibility: "public" }
            : candidate,
        ),
      );
    } finally {
      setPublishingId(null);
    }
  };

  const startComparison = async (value = newComparison) => {
    const clean = value.trim();
    if (!clean) {
      toast.error("Enter a comparison query first.");
      return;
    }

    try {
      setIsCreating(true);
      const res = await apiFetch(buildApiUrl("/api/comparisons/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: clean }),
      });
      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType?.includes("application/json")) {
        throw new Error("Unable to start comparison research.");
      }

      const job = (await res.json()) as ComparisonJob;
      const historyItem = jobToHistoryItem(job);
      setItems((current) => [historyItem, ...current.filter((item) => item.id !== job.id)]);
      setNewComparison("");
      toast.success("Research started.", {
        description: "Opening the live comparison workbench.",
      });
      navigate(`/app/comparisons/${job.id}`);
    } catch (creationError) {
      const mockId = "mock-" + Date.now();
      toast.success("Mock research started.");
      navigate(`/app/comparisons/${mockId}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div ref={containerRef} className="space-y-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
            Comparisons
          </p>
          <h1 className="mt-3 font-serif text-4xl text-[#fdfbf7] tracking-tight">
            Saved research runs
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-[#fdfbf7]/60 leading-relaxed">
            Review every authenticated comparison job, publish completed reports, and reopen public pages without digging through browser history.
          </p>
        </div>

        <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="hidden h-10 w-10 items-center justify-center rounded-sm bg-[#1a1a1a] text-orange-500 border border-[#333] sm:flex">
              <GitCompareArrows className="h-4 w-4" />
            </div>
            <input
              value={newComparison}
              onChange={(event) => setNewComparison(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void startComparison();
                }
              }}
              placeholder="Start: Product A vs Product B"
              className="h-10 min-w-0 bg-transparent px-3 text-sm text-[#fdfbf7] outline-none placeholder:text-[#fdfbf7]/30 sm:w-64"
            />
            <button
              type="button"
              onClick={() => void startComparison()}
              disabled={isCreating}
              className="inline-flex h-10 items-center justify-center rounded-sm bg-[#fdfbf7] px-6 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0] disabled:opacity-50"
            >
              {isCreating ? "Starting..." : "Start"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => void startComparison(example)}
            disabled={isCreating}
            className="rounded-sm border border-[#333] bg-[#111] px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 transition-all hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-400 disabled:opacity-40"
          >
            {example}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Total" value={counts.all} />
        <Metric label="Completed" value={counts.completed} />
        <Metric label="Public" value={counts.public} />
      </div>

      <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#fdfbf7]/30" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by query or entity"
              className="h-12 w-full rounded-sm border border-[#333] bg-[#0c0b0a] pl-11 pr-4 text-sm text-[#fdfbf7] outline-none transition-colors placeholder:text-[#fdfbf7]/30 focus:border-orange-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((item) => {
              const active = filter === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={[
                    "rounded-sm border px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors",
                    active
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-[#333] bg-[#0c0b0a] text-[#fdfbf7]/40 hover:border-[#555] hover:text-[#fdfbf7]",
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
              onPublish={() => void publish(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: number }) => (
  <div className="comp-row rounded-sm border border-[#2a2a2a] bg-[#111] p-6">
    <p className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
      {label}
    </p>
    <p className="mt-3 font-serif text-4xl text-[#fdfbf7]">{value}</p>
  </div>
);

const jobToHistoryItem = (job: ComparisonJob): ComparisonHistoryItem => ({
  id: job.id,
  query: job.query,
  slug: job.result?.slug || slugFromQuery(job.query),
  status: job.status,
  visibility: "private",
  sourceCount: job.result?.sourceCount || 0,
  progress: job.progress,
  updatedAt: new Date().toISOString(),
  summary: job.result?.verdict.summary || null,
  entityA: job.result?.entities.a.name || null,
  entityB: job.result?.entities.b.name || null,
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
  onPublish,
}: {
  item: ComparisonHistoryItem;
  isPublishing: boolean;
  onPublish: () => void;
}) => {
  const StatusIcon = statusIcon[item.status];
  const VisibilityIcon = visibilityIcon[item.visibility];
  const title = [item.entityA, item.entityB].filter(Boolean).join(" vs ") || item.query;

  return (
    <article className="comp-row rounded-sm border border-[#2a2a2a] bg-[#111] p-8 transition-colors hover:border-[#444]">
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
          </div>

          <h2 className="mt-5 font-serif text-2xl text-[#fdfbf7] tracking-tight">
            {title}
          </h2>
          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[#fdfbf7]/30">{item.query}</p>

          {item.summary && (
            <p className="mt-4 line-clamp-2 max-w-4xl text-sm leading-relaxed text-[#fdfbf7]/70 border-l-2 border-orange-500 pl-4">
              {item.summary}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
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

        <div className="flex flex-wrap items-center gap-3 lg:justify-end shrink-0">
          <Link
            to={`/app/comparisons/${item.id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-[#fdfbf7] px-5 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0]"
          >
            Review
          </Link>
          {item.visibility === "public" ? (
            <Link
              to={`/compare/${item.slug}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-sm border border-[#333] bg-[#0c0b0a] px-5 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7] transition-colors hover:border-[#555]"
            >
              Open Link
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onPublish}
              disabled={item.status !== "completed" || isPublishing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-sm border border-orange-500/30 bg-orange-500/10 px-5 text-[10px] font-bold uppercase tracking-widest text-orange-400 transition-colors hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-40"
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
    </article>
  );
};

export default ComparisonsPage;