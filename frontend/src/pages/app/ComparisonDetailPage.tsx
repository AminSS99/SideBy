import React, { useMemo, useState, useRef, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowLeft,
  Globe2,
  Loader2,
  LockKeyhole,
  RefreshCw,
  XCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { researchSteps } from "@/lib/comparisonUtils";
import { captureEvent } from "@/lib/posthog";
import {
  type ComparisonActivityStep,
  type ComparisonData,
  CategorySection,
  ComparisonHeader,
  DecisionIntelligencePanel,
  FollowUpPanel,
  ResearchLoader,
  SourcesPanel,
  VerdictPanel,
  EntityFactPanel,
  RadarChartPanel,
  ConsensusPanel,
  FeatureMatrixPanel,
  TableOfContents,
  RunTelemetryPanel,
  FeedbackPanel,
  VersionHistoryUI,
  DecisionMatrixPanel,
  WatchlistPanel,
} from "@/components/Comparison/ComparisonEngine";

type ComparisonJob = {
  id: string;
  status: "running" | "completed" | "failed";
  progress: number;
  activeStep: number;
  query: string;
  result: ComparisonData | null;
  visibility?: "private" | "team" | "public";
  error?: string | null;
  failedStep?: string | null;
  retryable?: boolean;
  activity?: ComparisonActivityStep[];
};

const ComparisonDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isChangingVisibility, setIsChangingVisibility] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [viewedHistoricalResult, setViewedHistoricalResult] = useState<ComparisonData | null>(null);
  const [viewedHistoricalVersionNumber, setViewedHistoricalVersionNumber] = useState<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const comparisonQuery = useQuery({
    queryKey: ["app-comparison", id],
    queryFn: async () => {
      const res = await apiFetch(buildApiUrl(`/api/comparisons/${id}`));
      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType?.includes("application/json")) {
        throw new Error("Unable to load this comparison.");
      }
      return (await res.json()) as ComparisonJob;
    },
    enabled: Boolean(id),
    refetchInterval: (query) => (query.state.data?.status === "running" ? 2500 : false),
    refetchOnWindowFocus: false,
    staleTime: 1500,
  });

  const job = comparisonQuery.data;
  const result = viewedHistoricalResult || job?.result;
  const latestActivityError = useMemo(() => {
    return job?.activity?.find((step) => step.status === "failed" && step.error)?.error ?? null;
  }, [job?.activity]);

  const entityFacts = useMemo(() => {
    if (!result) return { a: [] as { category: string }[], b: [] as { category: string }[] };
    const facts = result.categories.flatMap((category) =>
      category.facts.map((fact) => ({ ...fact, category: category.name })),
    );
    return {
      a: facts.filter((fact) => fact.entity === "a"),
      b: facts.filter((fact) => fact.entity === "b"),
    };
  }, [result]);

  const refresh = async () => {
    if (!id) return;
    try {
      setIsRefreshing(true);
      captureEvent("comparison_refresh_started", { comparison_id: id });
      const res = await apiFetch(buildApiUrl(`/api/comparisons/${id}/manage`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh" }),
      });
      if (!res.ok) {
        throw new Error("Unable to refresh this comparison.");
      }
      await comparisonQuery.refetch();
      captureEvent("comparison_refresh_succeeded", { comparison_id: id });
      toast.success("Comparison refreshed.", {
        description: "The source-backed matrix has been regenerated.",
      });
    } catch (refreshError) {
      captureEvent("comparison_refresh_failed", {
        comparison_id: id,
        error: refreshError instanceof Error ? refreshError.message : "unknown",
      });
      toast.error("Unable to refresh this comparison.", {
        description: refreshError instanceof Error ? refreshError.message : "Please try again.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const retryJob = async () => {
    if (!id) return;
    try {
      setIsRetrying(true);
      captureEvent("comparison_retry_started", { comparison_id: id });
      const res = await apiFetch(buildApiUrl(`/api/comparisons/${id}/manage`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry" }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Unable to retry this comparison.");
      }
      await comparisonQuery.refetch();
      captureEvent("comparison_retry_succeeded", { comparison_id: id });
      toast.success("Research restarted.", {
        description: "The comparison is being reprocessed from the beginning.",
      });
    } catch (retryError) {
      captureEvent("comparison_retry_failed", {
        comparison_id: id,
        error: retryError instanceof Error ? retryError.message : "unknown",
      });
      toast.error("Unable to restart research.", {
        description: retryError instanceof Error ? retryError.message : "Please try again.",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const toggleVisibility = async () => {
    if (!id || !job) return;
    const nextAction = job.visibility === "public" ? "unpublish" : "publish";

    try {
      setIsChangingVisibility(true);
      captureEvent(`comparison_${nextAction}_started`, { comparison_id: id });
      const res = await apiFetch(buildApiUrl(`/api/comparisons/${id}/visibility`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: nextAction }),
      });
      if (!res.ok) {
        throw new Error(
          nextAction === "publish"
            ? "Unable to publish this comparison."
            : "Unable to make this comparison private.",
        );
      }
      await comparisonQuery.refetch();
      captureEvent(`comparison_${nextAction}_succeeded`, { comparison_id: id });
      toast.success(
        nextAction === "publish" ? "Comparison published." : "Comparison made private.",
        {
          description:
            nextAction === "publish"
              ? "The public compare page is now available."
              : "The public compare page is no longer visible.",
        },
      );
    } catch (visibilityError) {
      captureEvent(`comparison_${nextAction}_failed`, {
        comparison_id: id,
        error: visibilityError instanceof Error ? visibilityError.message : "unknown",
      });
      toast.error(
        nextAction === "publish" ? "Unable to publish." : "Unable to make private.",
        {
          description: visibilityError instanceof Error ? visibilityError.message : "Please try again.",
        }
      );
    } finally {
      setIsChangingVisibility(false);
    }
  };

  useEffect(() => {
    if (!job) return;
    captureEvent("comparison_viewed", {
      comparison_id: job.id,
      status: job.status,
      has_result: Boolean(job.result),
    });
    if (job.status === "failed") {
      captureEvent("comparison_failed_viewed", {
        comparison_id: job.id,
        failed_step: job.failedStep,
        error: job.error,
        retryable: job.retryable,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id, job?.status]);

  useGSAP(() => {
    if (!comparisonQuery.isLoading && result) {
      const tl = gsap.timeline();
      const actions = gsap.utils.toArray(".wb-actions");
      const grid = gsap.utils.toArray(".wb-grid");
      tl.from(".wb-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" });
      if (actions.length) {
        tl.from(actions, { x: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.6");
      }
      if (grid.length) {
        tl.from(grid, { y: 60, opacity: 0, duration: 1.2, ease: "expo.out" }, "-=0.4");
      }
    }
  }, [comparisonQuery.isLoading, result]);

  return (
    <div ref={containerRef} className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="wb-header">
          <Link
            to="/app/comparisons"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-white/40 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Comparisons
          </Link>
          <h1 className="mt-4 text-4xl font-black uppercase tracking-tight">
            Comparison workbench
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/55">
            Reopen private research, watch running jobs, refresh facts, publish links, and ask follow-up questions from one place.
          </p>
        </div>

        {result && job && (
          <div className="wb-actions flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void toggleVisibility()}
              disabled={isChangingVisibility}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#333] bg-[#111] px-5 text-xs font-bold uppercase tracking-[0.25em] text-[#fdfbf7] transition-colors hover:border-orange-500/40 hover:text-orange-400 disabled:opacity-50"
            >
              {job.visibility === "public" ? (
                <LockKeyhole className="h-4 w-4" />
              ) : (
                <Globe2 className="h-4 w-4" />
              )}
              {isChangingVisibility
                ? "Updating..."
                : job.visibility === "public"
                  ? "Make private"
                  : "Publish"}
            </button>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={isRefreshing}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#fdfbf7] px-5 text-xs font-bold uppercase tracking-[0.25em] text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0] disabled:opacity-50"
            >
              {isRefreshing ? "Refreshing..." : "Refresh facts"}
            </button>
            <button
              type="button"
              onClick={() => setIsVersionsOpen(true)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#333] bg-[#111] px-5 text-xs font-bold uppercase tracking-[0.25em] text-[#fdfbf7] transition-colors hover:border-orange-500/40 hover:text-orange-400"
            >
              <Clock className="h-4 w-4" />
              History
            </button>
          </div>
        )}
      </div>

      {viewedHistoricalResult && viewedHistoricalVersionNumber && (
        <div className="rounded-3xl border border-orange-500/30 bg-orange-500/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">Viewing historical Snapshot V{viewedHistoricalVersionNumber}</p>
              <p className="text-xs text-white/55">This displays research facts and scores captured during a past execution.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setViewedHistoricalResult(null);
              setViewedHistoricalVersionNumber(undefined);
            }}
            className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-orange-400 hover:bg-orange-500/20 transition-colors"
          >
            Return to latest
          </button>
        </div>
      )}

      {comparisonQuery.isLoading ? (
        <div className="flex items-center justify-center rounded-[28px] border border-white/10 bg-black/30 py-24">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-orange-500/60" />
            <p className="text-sm text-white/45">Loading comparison...</p>
          </div>
        </div>
      ) : comparisonQuery.error || !job ? (
        <div className="rounded-[28px] border border-amber-400/25 bg-amber-400/10 p-8">
          <h2 className="text-xl font-bold text-white">Comparison unavailable</h2>
          <p className="mt-2 text-sm text-amber-100/80">
            {comparisonQuery.error instanceof Error
              ? comparisonQuery.error.message
              : "This comparison could not be loaded."}
          </p>
          <button
            type="button"
            onClick={() => void comparisonQuery.refetch()}
            className="mt-5 rounded-full border border-amber-300/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100 transition-colors hover:bg-amber-300/10"
          >
            Retry
          </button>
        </div>
      ) : job.status === "failed" ? (
        <div className="space-y-6">
          {/* Error banner */}
          <div className="rounded-[28px] border border-red-400/20 bg-red-400/10 p-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-red-300">
                <XCircle className="h-3 w-3" />
                Failed
              </span>
              {job.failedStep && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-300/60">
                  at {job.failedStep} step
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white">Research failed</h2>
            <p className="mt-2 text-sm text-red-100/75">
              {job.error || latestActivityError || "The comparison job failed before a result was saved."}
            </p>
            {latestActivityError && latestActivityError !== job.error && (
              <p className="mt-3 rounded-2xl border border-red-300/15 bg-black/20 p-3 font-mono text-xs leading-relaxed text-red-100/65">
                {latestActivityError}
              </p>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {job.retryable !== false && (
                <button
                  type="button"
                  onClick={() => void retryJob()}
                  disabled={isRetrying}
                  className="inline-flex items-center gap-2 rounded-full border border-red-200/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-100 transition-colors hover:bg-red-200/10 disabled:opacity-50"
                >
                  {isRetrying ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Restarting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3" />
                      Retry research
                    </>
                  )}
                </button>
              )}
              <Link
                to="/app/comparisons"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60 transition-colors hover:bg-white/5"
              >
                New comparison
              </Link>
            </div>
          </div>

          {/* Partial result fallback */}
          {result && (
            <div className="rounded-[28px] border border-amber-500/20 bg-amber-500/5 p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-amber-400 font-bold uppercase tracking-widest mb-1">
                    Partial Result Available
                  </p>
                  <p className="text-sm text-amber-100/70">
                    Some data was saved before the failure. You can review it below, but note that some sections may be missing or incomplete.
                  </p>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="wb-grid grid gap-10 xl:grid-cols-12 relative items-start">
              <div className="space-y-10 xl:col-span-8">
                <ComparisonHeader
                  result={result}
                  onRefresh={() => void refresh()}
                  comparisonId={job.id}
                />
                <DecisionIntelligencePanel
                  result={result}
                  activity={job.activity}
                  comparisonId={job.id}
                />
                <RadarChartPanel result={result} />
                <ConsensusPanel result={result} />
                <FeatureMatrixPanel result={result} />
                <DecisionMatrixPanel result={result} comparisonId={job.id} />
                <div className="space-y-10">
                  {result.categories.map((category, index) => (
                    <CategorySection
                      key={category.name}
                      category={category}
                      entities={result.entities}
                      index={index}
                    />
                  ))}
                </div>
              </div>
              <aside className="space-y-6 xl:col-span-4 sticky top-6 self-start pb-8 h-[calc(100vh-2rem)] overflow-y-auto no-scrollbar">
                <TableOfContents result={result} />
                <VerdictPanel result={result} />
                <WatchlistPanel result={result} comparisonId={job.id} />
                <EntityFactPanel result={result} facts={entityFacts} />
                <SourcesPanel sources={result.sources} />
                <RunTelemetryPanel result={result} />
                <FeedbackPanel />
                <FollowUpPanel comparisonId={job.id} />
              </aside>
            </div>
          )}
        </div>
      ) : job.status === "running" || !result ? (
        <ResearchLoader
          query={job.query}
          progress={job.progress}
          activeStep={job.activeStep}
          steps={researchSteps}
          activity={job.activity}
        />
      ) : (
        <div className="wb-grid grid gap-10 xl:grid-cols-12 relative items-start">
          <div className="space-y-10 xl:col-span-8">
            <ComparisonHeader
              result={result}
              onRefresh={() => void refresh()}
              comparisonId={job.id}
            />
            <DecisionIntelligencePanel
              result={result}
              activity={job.activity}
              comparisonId={job.id}
            />
            
            <RadarChartPanel result={result} />
            <ConsensusPanel result={result} />
            <FeatureMatrixPanel result={result} />
            <DecisionMatrixPanel result={result} comparisonId={job.id} />

            <div className="space-y-10">
              {result.categories.map((category, index) => (
                <CategorySection
                  key={category.name}
                  category={category}
                  entities={result.entities}
                  index={index}
                />
              ))}
            </div>
          </div>

          <aside className="space-y-6 xl:col-span-4 sticky top-6 self-start pb-8 h-[calc(100vh-2rem)] overflow-y-auto no-scrollbar">
            <TableOfContents result={result} />
            <VerdictPanel result={result} />
            <WatchlistPanel result={result} comparisonId={job.id} />
            <EntityFactPanel result={result} facts={entityFacts} />
            <SourcesPanel sources={result.sources} />
            <RunTelemetryPanel result={result} />
            <FeedbackPanel />
            <FollowUpPanel comparisonId={job.id} />
          </aside>
        </div>
      )}

      {id && (
        <VersionHistoryUI
          comparisonId={id}
          isOpen={isVersionsOpen}
          onClose={() => setIsVersionsOpen(false)}
          onSelectResult={(res, verNum) => {
            setViewedHistoricalResult(res);
            setViewedHistoricalVersionNumber(verNum);
          }}
          activeVersionNumber={viewedHistoricalVersionNumber}
        />
      )}
    </div>
  );
};

export default ComparisonDetailPage;
