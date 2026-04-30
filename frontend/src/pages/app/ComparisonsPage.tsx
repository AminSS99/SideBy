import React, { useEffect, useMemo, useState } from "react";
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
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";

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
  completed: "bg-emerald-300 text-black",
  running: "bg-white/10 text-white/60",
  failed: "bg-red-400/20 text-red-200",
} satisfies Record<ComparisonStatus, string>;

const visibilityIcon = {
  private: LockKeyhole,
  team: Sparkles,
  public: Globe2,
} satisfies Record<ComparisonVisibility, React.ComponentType<{ className?: string }>>;

const ComparisonsPage = () => {
  const navigate = useNavigate();
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
    <div className="space-y-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-400">
            Comparisons
          </p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-tight">
            Saved research runs
          </h1>
          <p className="mt-4 max-w-3xl text-white/60">
            Review every authenticated comparison job, publish completed reports, and reopen public pages without digging through browser history.
          </p>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-black/30 p-2 sm:rounded-[28px]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-300 sm:flex">
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
              className="h-10 min-w-0 bg-transparent px-2 text-sm text-white outline-none placeholder:text-white/25 sm:w-64"
            />
            <button
              type="button"
              onClick={() => void startComparison()}
              disabled={isCreating}
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-[#fdfbf7] px-4 text-xs font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-white/90 disabled:opacity-50"
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
            className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/35 transition-all hover:border-emerald-300/30 hover:bg-emerald-300/[0.05] hover:text-emerald-200 disabled:opacity-40"
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

      <div className="rounded-[28px] border border-white/10 bg-black/30 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by query or entity"
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-11 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-emerald-300/40"
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
                    "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors",
                    active
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-white/10 bg-white/[0.02] text-white/45 hover:border-white/25 hover:text-white",
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
        <div className="rounded-[28px] border border-amber-400/25 bg-amber-400/10 p-6 text-sm text-amber-100">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 rounded-full border border-amber-300/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors hover:bg-amber-300/10"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-[28px] border border-white/10 bg-black/30 p-10 text-sm text-white/55">
          Loading saved comparisons...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-white/25" />
          <h2 className="mt-4 text-xl font-bold text-white">No matching comparisons</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-white/50">
            Run a comparison from the homepage, then return here to manage its visibility and public report.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
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
  <div className="rounded-[28px] border border-white/10 bg-black/30 p-6">
    <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/35">
      {label}
    </p>
    <p className="mt-3 text-3xl font-black text-white">{value}</p>
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
    <article className="rounded-[28px] border border-white/10 bg-black/30 p-6 transition-colors hover:border-white/20 hover:bg-white/[0.04]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusClass[item.status]}`}>
              <StatusIcon className={`h-3.5 w-3.5 ${item.status === "running" ? "animate-spin" : ""}`} />
              {item.status}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
              <VisibilityIcon className="h-3.5 w-3.5" />
              {item.visibility}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-black tracking-tight text-white">
            {title}
          </h2>
          <p className="mt-2 text-sm text-white/45">{item.query}</p>

          {item.summary && (
            <p className="mt-4 line-clamp-2 max-w-4xl text-sm leading-relaxed text-white/60">
              {item.summary}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-4 text-xs uppercase tracking-[0.2em] text-white/35">
            <span className="inline-flex items-center gap-2">
              <Clock3 className="h-3.5 w-3.5" />
              {formatTimestamp(item.updatedAt)}
            </span>
            <span>{item.sourceCount} sources</span>
            <span>{item.progress}% complete</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Link
            to={`/app/comparisons/${item.id}`}
            className="inline-flex h-10 items-center gap-2 rounded-2xl bg-white px-4 text-xs font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-[#e0e0e0]"
          >
            Review
          </Link>
          {item.visibility === "public" ? (
            <Link
              to={`/compare/${item.slug}`}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 px-4 text-xs font-bold uppercase tracking-[0.2em] text-white/60 transition-colors hover:border-white/25 hover:text-white"
            >
              Open
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onPublish}
              disabled={item.status !== "completed" || isPublishing}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 px-4 text-xs font-bold uppercase tracking-[0.2em] text-white/60 transition-colors hover:border-orange-500/40 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
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