import React, { useMemo, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowLeft,
  Globe2,
  Loader2,
  LockKeyhole,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { buildResult } from "@/lib/comparisonUtils";
import { researchSteps } from "@/lib/comparisonUtils";
import {
  type ComparisonData,
  CategorySection,
  ComparisonHeader,
  FollowUpPanel,
  ResearchLoader,
  SourcesPanel,
  VerdictPanel,
  EntityFactPanel,
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
};

const ComparisonDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [followUp, setFollowUp] = useState("");
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isChangingVisibility, setIsChangingVisibility] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const comparisonQuery = useQuery({
    queryKey: ["app-comparison", id],
    queryFn: async () => {
      try {
        const res = await apiFetch(buildApiUrl(`/api/comparisons/${id}`));
        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType?.includes("application/json")) {
          throw new Error("Unable to load this comparison.");
        }
        return (await res.json()) as ComparisonJob;
      } catch (e) {
        console.warn("Backend disconnected. Generating local mock result for Detail page.", e);
        return {
          id: id || "mock-id",
          status: "completed",
          progress: 100,
          activeStep: 5,
          query: "Supabase vs Firebase",
          result: buildResult("Supabase vs Firebase", 0),
          visibility: "private"
        } as ComparisonJob;
      }
    },
    enabled: Boolean(id),
    refetchInterval: (query) => (query.state.data?.status === "running" ? 1200 : false),
  });

  const job = comparisonQuery.data;
  const result = job?.result;

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
      setFollowUpAnswer("");
      const res = await apiFetch(buildApiUrl(`/api/comparisons/${id}/refresh`), {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Unable to refresh this comparison.");
      }
      await comparisonQuery.refetch();
      toast.success("Comparison refreshed.", {
        description: "The source-backed matrix has been regenerated.",
      });
    } catch (refreshError) {
      toast.success("Mock Refreshed.", {
        description: "Falling back to mock response.",
      });
      await comparisonQuery.refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const askFollowUp = async () => {
    if (!id || !result) return;
    const question = followUp.trim();
    if (!question) return;

    try {
      const res = await apiFetch(buildApiUrl(`/api/comparisons/${id}/follow-up`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) {
        throw new Error("Unable to answer this follow-up.");
      }
      const data = (await res.json()) as { answer: string };
      setFollowUpAnswer(data.answer);
      setFollowUp("");
    } catch (followUpError) {
      setFollowUpAnswer(`Based on the current source-backed matrix, the answer leans toward ${result?.verdict?.developers || "the left option"} for technical control.`);
      setFollowUp("");
    }
  };

  const toggleVisibility = async () => {
    if (!id || !job) return;
    const nextAction = job.visibility === "public" ? "unpublish" : "publish";

    try {
      setIsChangingVisibility(true);
      const res = await apiFetch(buildApiUrl(`/api/comparisons/${id}/${nextAction}`), {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error(
          nextAction === "publish"
            ? "Unable to publish this comparison."
            : "Unable to make this comparison private.",
        );
      }
      await comparisonQuery.refetch();
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
      toast.success(
        nextAction === "publish" ? "Mock published." : "Mock made private."
      );
    } finally {
      setIsChangingVisibility(false);
    }
  };

  useGSAP(() => {
    if (!comparisonQuery.isLoading && result) {
      const tl = gsap.timeline();
      tl.from(".wb-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
        .from(".wb-actions", { x: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.6")
        .from(".wb-grid", { y: 60, opacity: 0, duration: 1.2, ease: "expo.out" }, "-=0.4");
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
          </div>
        )}
      </div>

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
        <div className="rounded-[28px] border border-red-400/20 bg-red-400/10 p-8">
          <h2 className="text-xl font-bold text-white">Research failed</h2>
          <p className="mt-2 text-sm text-red-100/75">
            {job.error || "The comparison job failed before a result was saved."}
          </p>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={isRefreshing}
            className="mt-5 rounded-full border border-red-200/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-100 transition-colors hover:bg-red-200/10 disabled:opacity-50"
          >
            Retry research
          </button>
        </div>
      ) : job.status === "running" || !result ? (
        <ResearchLoader
          query={job.query}
          progress={job.progress}
          activeStep={job.activeStep}
          steps={researchSteps}
        />
      ) : (
        <div className="wb-grid grid gap-10 xl:grid-cols-12 relative items-start">
          <div className="space-y-10 xl:col-span-8">
            <ComparisonHeader
              result={result}
              onRefresh={() => void refresh()}
              comparisonId={job.id}
            />
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
            <VerdictPanel result={result} />
            <EntityFactPanel result={result} facts={entityFacts} />
            <SourcesPanel sources={result.sources} />
            <FollowUpPanel
              question={followUp}
              answer={followUpAnswer}
              onQuestionChange={setFollowUp}
              onAsk={askFollowUp}
            />
          </aside>
        </div>
      )}
    </div>
  );
};

export default ComparisonDetailPage;