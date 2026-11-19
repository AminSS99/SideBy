import React, { useEffect, useMemo, useState, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);
import {
  Activity,
  BookOpenCheck,
  CheckCircle2,
  Clipboard,
  Copy,
  Diff,
  FileText,
  Gauge,
  GitBranch,
  Network,
  SlidersHorizontal,
  Trophy,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { copyText } from "@/lib/clipboard";
import { panelClass } from "./constants";
import type {
  Category,
  ComparisonActivityStep,
  ComparisonData,
  ComparisonFact,
  ComparisonSource,
  EntityKey,
} from "./types";
import { safeHref } from "@/lib/safe-url";
import { formatDate, statusLabel, useI18n, useT, type MessageKey, type TFunction } from "@/i18n";

type DecisionIntelligencePanelProps = {
  result: ComparisonData;
  activity?: ComparisonActivityStep[];
  comparisonId: string;
};

type FactWithCategory = ComparisonFact & {
  category: string;
};

type DecisionMetric = {
  subject: string;
  a: number;
  b: number;
};

type GraphNode = {
  id: string;
  type: "verdict" | "entity" | "dimension" | "fact" | "source";
  label: string;
  detail: string;
  x: number;
  y: number;
  color: string;
};

type GraphEdge = {
  from: string;
  to: string;
  color: string;
};

const confidenceLabelKey = (value: number): MessageKey => {
  if (value >= 0.82) return "di.conf.strong";
  if (value >= 0.64) return "di.conf.watch";
  return "di.conf.thin";
};

const PRESET_KEYS: Record<"balanced" | "startup" | "enterprise" | "developer", MessageKey> = {
  balanced: "di.weights.preset.balanced",
  startup: "di.weights.preset.startup",
  enterprise: "di.weights.preset.enterprise",
  developer: "di.weights.preset.developer",
};

const GRAPH_NODE_TYPE_KEYS: Record<GraphNode["type"], MessageKey> = {
  verdict: "di.graph.type.verdict",
  entity: "di.graph.type.entity",
  dimension: "di.graph.type.dimension",
  fact: "di.graph.type.fact",
  source: "di.graph.type.source",
};

const SOURCE_MODE_KEYS: Record<"balanced" | "official" | "recent" | "community" | "contradictions", MessageKey> = {
  balanced: "di.sources.mode.balanced",
  official: "di.sources.mode.official",
  recent: "di.sources.mode.recent",
  community: "di.sources.mode.community",
  contradictions: "di.sources.mode.contradictions",
};

const confidenceColor = (value: number) => {
  if (value >= 0.82) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/25";
  if (value >= 0.64) return "bg-amber-500/15 text-amber-300 border-amber-500/25";
  return "bg-red-500/15 text-red-300 border-red-500/25";
};

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const safeHostname = (url?: string | null) => {
  if (!url || url === "#") return "source";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
};

const factsCache = new WeakMap<ComparisonData, FactWithCategory[]>();

const allFacts = (result: ComparisonData): FactWithCategory[] => {
  if (factsCache.has(result)) {
    return factsCache.get(result)!;
  }

  const all: FactWithCategory[] = [];
  for (const category of result.categories) {
    for (const fact of category.facts) {
      all.push({ ...fact, category: category.name });
    }
  }

  factsCache.set(result, all);
  return all;
};

const categoryScore = (category: Category, entity: EntityKey) => {
  if (category.winner === "tie") return 68;
  if (category.winner === entity) return 82;
  return 54;
};

const metricsCache = new WeakMap<ComparisonData, DecisionMetric[]>();

const buildMetrics = (result: ComparisonData): DecisionMetric[] => {
  if (metricsCache.has(result)) {
    return metricsCache.get(result)!;
  }

  let metrics: DecisionMetric[];
  if (result.dimensions?.length) {
    metrics = result.dimensions.map((dimension) => ({
      subject: dimension.subject,
      a: dimension.a,
      b: dimension.b,
    }));
  } else {
    metrics = result.categories.map((category) => ({
      subject: category.name,
      a: categoryScore(category, "a"),
      b: categoryScore(category, "b"),
    }));
  }

  metricsCache.set(result, metrics);
  return metrics;
};

const sourceReliability = (source: ComparisonSource) =>
  (source.reliability || source.sourceType || "").toLowerCase();

const isOfficialSource = (source: ComparisonSource) => {
  const rel = sourceReliability(source);
  return ["official", "docs", "pricing", "statistics", "database"].some((term) =>
    rel.includes(term),
  );
};

const isRecentSource = (source: ComparisonSource) => {
  const fetched = new Date(source.fetchedAt).getTime();
  if (!Number.isFinite(fetched)) return false;
  const ageDays = (Date.now() - fetched) / (1000 * 60 * 60 * 24);
  return ageDays <= 30;
};

const sourceKey = (source: Pick<ComparisonSource, "url" | "title">) =>
  `${source.url || "source"}:${source.title || ""}`;

const sourceQualityWeight = (source: ComparisonSource) => {
  const reliability = sourceReliability(source);
  if (isOfficialSource(source)) return 1;
  if (reliability.includes("review") || reliability.includes("analysis")) return 0.72;
  if (reliability.includes("community")) return 0.52;
  return 0.6;
};

const sourceQualitySummary = (sources: ComparisonSource[]) => {
  if (sources.length === 0) return { score: 0, official: 0, recent: 0 };

  let totalScore = 0;
  let officialCount = 0;
  let recentCount = 0;

  for (const source of sources) {
    const evidenceConfidence = source.confidence ?? 0.75;
    const isRecent = isRecentSource(source);
    const freshnessWeight = isRecent ? 1 : 0.85;

    totalScore += sourceQualityWeight(source) * evidenceConfidence * freshnessWeight;
    if (isOfficialSource(source)) officialCount++;
    if (isRecent) recentCount++;
  }

  const score = totalScore / sources.length;

  return {
    score: Math.round(score * 100),
    official: Math.round((officialCount / sources.length) * 100),
    recent: Math.round((recentCount / sources.length) * 100),
  };
};

export const DecisionIntelligencePanel = ({
  result,
  activity = [],
  comparisonId,
}: DecisionIntelligencePanelProps) => {
  return (
    <div className="space-y-10">
      <ExecutiveBriefPanel result={result} />
      <DecisionWeightsPanel result={result} />
      <div className="grid gap-6 xl:grid-cols-2">
        <ChangeTimelinePanel result={result} />
        <ConfidenceHeatmapPanel result={result} />
      </div>
      <EvidenceGraphPanel result={result} />
      <ResearchReplayPanel result={result} activity={activity} />
      <div className="grid gap-6 xl:grid-cols-2">
        <SourceQualityPanel result={result} />
        <DecisionBoardPanel result={result} comparisonId={comparisonId} />
      </div>
    </div>
  );
};

const SectionHeader = ({
  icon: Icon,
  eyebrow,
  title,
  right,
}: {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  right?: React.ReactNode;
}) => (
  <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-[#2a2a2a] pb-5">
    <div className="flex min-w-0 flex-1 items-center gap-3.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-[#333] bg-[#111] text-orange-400">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500/60">
          {eyebrow}
        </p>
        <h3 className="mt-1 font-serif text-xl sm:text-2xl tracking-tight text-[#fdfbf7] break-words">
          {title}
        </h3>
      </div>
    </div>
    {right ? <div className="shrink-0 max-w-full">{right}</div> : null}
  </div>
);

const ExecutiveBriefPanel = ({ result }: { result: ComparisonData }) => {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const topCategories = result.categories.slice(0, 4);
  const citedSources = result.sources.slice(0, 4);
  const memo = useMemo(() => {
    const categoryLines = topCategories
      .map((category) => {
        const winner =
          category.winner === "tie"
            ? t("res.cat.tie")
            : category.winner === "a"
              ? result.entities.a.name
              : result.entities.b.name;
        return `- ${category.name}: ${winner}. ${category.verdict}`;
      })
      .join("\n");

    const sourceLines = citedSources
      .map((source) => `- ${source.title || safeHostname(source.url)} (${source.url})`)
      .join("\n");

    return [
      `${result.query}`,
      "",
      t("di.brief.memo.recommendation", {
        value: result.verdict.bestOverall || t("di.brief.memo.reviewWeighted"),
      }),
      "",
      result.verdict.summary,
      "",
      t("di.brief.memo.signals"),
      categoryLines || t("di.brief.memo.noSignals"),
      "",
      t("di.brief.memo.whatChanges"),
      result.contradictions?.length
        ? result.contradictions.map((item) => `- ${item}`).join("\n")
        : t("di.brief.memo.defaultChange"),
      "",
      t("di.brief.memo.sources"),
      sourceLines || t("di.brief.memo.noSources"),
    ].join("\n");
  }, [citedSources, result, t, topCategories]);

  const copyMemo = async () => {
    const ok = await copyText(memo);
    setCopied(ok);
    if (ok) window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section id="executive-brief" className={cn(panelClass, "p-6 md:p-8 scroll-mt-28")}>
      <SectionHeader
        icon={FileText}
        eyebrow={t("di.brief.eyebrow")}
        title={t("di.brief.title")}
        right={
          <button
            type="button"
            onClick={() => void copyMemo()}
            className="inline-flex h-10 items-center gap-2 rounded-sm border border-[#333] bg-[#111] px-3 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60 transition-colors hover:border-orange-500/40 hover:text-orange-400"
          >
            {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t("di.brief.copied") : t("di.brief.copy")}
          </button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-sm border border-orange-500/20 bg-orange-500/10 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-300/70">
            {t("di.brief.currentRec")}
          </p>
          <p className="mt-3 font-serif text-3xl leading-tight text-[#fdfbf7]">
            {result.verdict.bestOverall || t("di.brief.fallbackOverall")}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[#fdfbf7]/65">
            {result.verdict.summary}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {topCategories.map((category) => {
            const winner =
              category.winner === "tie"
                ? t("res.cat.tie")
                : category.winner === "a"
                  ? result.entities.a.name
                  : result.entities.b.name;
            return (
              <div key={category.name} className="rounded-sm border border-[#2a2a2a] bg-[#111] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="truncate text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
                    {category.name}
                  </p>
                  <span className="rounded-sm border border-[#333] bg-[#0c0b0a] px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-orange-300">
                    {winner}
                  </span>
                </div>
                <p className="line-clamp-3 text-xs leading-relaxed text-[#fdfbf7]/60">
                  {category.verdict}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const DecisionWeightsPanel = ({ result }: { result: ComparisonData }) => {
  const t = useT();
  const metrics = buildMetrics(result);
  const [weights, setWeights] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const metric of metrics) {
      init[metric.subject] = 1;
    }
    return init;
  });

  useEffect(() => {
    setWeights((current) => {
      const next: Record<string, number> = {};
      for (const metric of metrics) {
        next[metric.subject] = current[metric.subject] ?? 1;
      }
      return next;
    });
  }, [metrics]);

  const weighted = useMemo(() => {
    let sumWeight = 0;
    let sumA = 0;
    let sumB = 0;

    for (const metric of metrics) {
      const weight = weights[metric.subject] ?? 1;
      sumWeight += weight;
      sumA += metric.a * weight;
      sumB += metric.b * weight;
    }

    const totalWeight = sumWeight || 1;
    const a = sumA / totalWeight;
    const b = sumB / totalWeight;

    return { a, b, winner: Math.abs(a - b) < 1 ? "tie" : a > b ? "a" : "b" };
  }, [metrics, weights]);

  // Balanced-weights outcome (every dimension at 1x) is the preserved
  // "original" this panel compares against; it never mutates stored scores.
  const balanced = useMemo(() => {
    if (metrics.length === 0) return null;
    const a = metrics.reduce((sum, metric) => sum + metric.a, 0) / metrics.length;
    const b = metrics.reduce((sum, metric) => sum + metric.b, 0) / metrics.length;
    return { a, b, winner: (Math.abs(a - b) < 1 ? "tie" : a > b ? "a" : "b") as "a" | "b" | "tie" };
  }, [metrics]);

  const hasAdjustedWeights = metrics.some(
    (metric) => Math.abs((weights[metric.subject] ?? 1) - 1) > 0.001,
  );

  const restoreOriginalWeights = () => {
    const next: Record<string, number> = {};
    for (const metric of metrics) next[metric.subject] = 1;
    setWeights(next);
  };

  // Dimensions most responsible for the current leader: highest weight where
  // the leader also outscores the other side. Used only for explanation text.
  const drivers = useMemo(() => {
    if (!balanced || weighted.winner === "tie") return [];
    const leader = weighted.winner;
    return metrics
      .filter((metric) => (leader === "a" ? metric.a > metric.b : metric.b > metric.a))
      .map((metric) => ({ subject: metric.subject, weight: weights[metric.subject] ?? 1 }))
      .sort((x, y) => y.weight - x.weight)
      .slice(0, 2)
      .map((metric) => metric.subject);
  }, [balanced, metrics, weighted.winner, weights]);

  const applyPreset = (preset: "startup" | "enterprise" | "developer" | "balanced") => {
    const next: Record<string, number> = {};
    for (const metric of metrics) {
      const subject = metric.subject.toLowerCase();
      let value = 1;
      if (preset === "startup") {
        value = subject.includes("pricing") || subject.includes("value") ? 1.8 : 0.9;
      }
      if (preset === "enterprise") {
        value = subject.includes("security") || subject.includes("reliability") || subject.includes("scale") ? 1.8 : 0.9;
      }
      if (preset === "developer") {
        value = subject.includes("developer") || subject.includes("ecosystem") || subject.includes("learning") ? 1.8 : 0.9;
      }
      next[metric.subject] = value;
    }
    setWeights(next);
  };

  const winnerName =
    weighted.winner === "tie"
      ? t("res.cat.tie")
      : weighted.winner === "a"
        ? result.entities.a.name
        : result.entities.b.name;

  return (
    <section id="personalized-verdict" className={cn(panelClass, "p-6 md:p-8 scroll-mt-28")}>
      <SectionHeader
        icon={SlidersHorizontal}
        eyebrow={t("di.weights.eyebrow")}
        title={t("di.weights.title")}
        right={
          <div className="flex flex-wrap gap-2">
            {(["balanced", "startup", "enterprise", "developer"] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyPreset(preset)}
                className="rounded-sm border border-[#333] bg-[#111] px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/50 transition-colors hover:border-orange-500/40 hover:text-orange-400"
              >
                {t(PRESET_KEYS[preset])}
              </button>
            ))}
          </div>
        }
      />

      {metrics.length === 0 || !balanced ? (
        <div role="note" className="rounded-sm border border-[#2a2a2a] bg-[#111] p-6 text-sm leading-relaxed text-[#fdfbf7]/55">
          {t("di.weights.unavailable")}
        </div>
      ) : (
      <div className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/35">
            {t("di.weights.winner")}
          </p>
          <p className="mt-3 font-serif text-4xl text-[#fdfbf7]">{winnerName}</p>
          <div className="mt-6 space-y-4">
            <ScoreBar label={result.entities.a.name} score={weighted.a} color={result.entities.a.hex} />
            <ScoreBar label={result.entities.b.name} score={weighted.b} color={result.entities.b.hex} />
          </div>
          <p className="mt-6 text-xs leading-relaxed text-[#fdfbf7]/55" aria-live="polite">
            {!hasAdjustedWeights
              ? t("di.weights.msg.original")
              : weighted.winner !== balanced.winner
                ? drivers.length
                  ? t("di.weights.msg.movedAheadDriven", {
                      winner: winnerName,
                      drivers: drivers.join(t("di.common.andJoiner")),
                    })
                  : t("di.weights.msg.movedAhead", { winner: winnerName })
                : weighted.winner === "tie"
                  ? t("di.weights.msg.tie")
                  : (() => {
                      const widened =
                        Math.abs(weighted.a - weighted.b) >= Math.abs(balanced.a - balanced.b);
                      if (drivers.length) {
                        return t(
                          widened ? "di.weights.msg.leadsWidenedDriven" : "di.weights.msg.leadsNarrowedDriven",
                          {
                            winner: winnerName,
                            drivers: drivers.join(t("di.common.andJoiner")),
                          },
                        );
                      }
                      return t(
                        widened ? "di.weights.msg.leadsWidened" : "di.weights.msg.leadsNarrowed",
                        { winner: winnerName },
                      );
                    })()}
          </p>
          {hasAdjustedWeights && (
            <button
              type="button"
              onClick={restoreOriginalWeights}
              className="mt-4 inline-flex min-h-10 items-center rounded-sm border border-orange-500/30 bg-orange-500/10 px-3.5 text-[10px] font-bold uppercase tracking-widest text-orange-300 transition-colors hover:bg-orange-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              {t("di.weights.restore")}
            </button>
          )}
        </div>

        <div className="space-y-4">
          {metrics.map((metric) => (
            <label key={metric.subject} className="block rounded-sm border border-[#2a2a2a] bg-[#111] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-sm font-serif text-[#fdfbf7]">{metric.subject}</span>
                <span className="font-mono text-xs text-orange-300">
                  {(weights[metric.subject] ?? 1).toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={weights[metric.subject] ?? 1}
                onChange={(event) =>
                  setWeights((current) => ({
                    ...current,
                    [metric.subject]: Number(event.target.value),
                  }))
                }
                className="w-full accent-orange-500"
              />
              <div className="mt-3 grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/35">
                <span>{result.entities.a.name}: {Math.round(metric.a)}</span>
                <span>{result.entities.b.name}: {Math.round(metric.b)}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
      )}
    </section>
  );
};

const ScoreBar = ({ label, score, color }: { label: string; score: number; color: string }) => (
  <div>
    <div className="mb-2 flex items-center justify-between text-xs">
      <span className="text-[#fdfbf7]/65">{label}</span>
      <span className="font-mono text-[#fdfbf7]">{score.toFixed(1)}</span>
    </div>
    <div className="h-2 overflow-hidden rounded-sm bg-[#252525]">
      <div className="h-full rounded-sm transition-all duration-500 ease-out" style={{ width: `${Math.max(0, Math.min(100, score))}%`, backgroundColor: color }} />
    </div>
  </div>
);

const ChangeTimelinePanel = ({ result }: { result: ComparisonData }) => {
  const t = useT();
  const facts = useMemo(() => allFacts(result), [result]);

  const { changedFacts, monitorFacts } = useMemo(() => {
    const changed = [];
    const monitor = [];
    for (const fact of facts) {
      if (fact.changed) changed.push(fact);
      if (fact.freshness === "Monitor" && monitor.length < 4) monitor.push(fact);
    }
    return { changedFacts: changed, monitorFacts: monitor };
  }, [facts]);

  const timeline = changedFacts.length > 0 ? changedFacts : monitorFacts;

  return (
    <section id="changed-facts" className={cn(panelClass, "p-6 md:p-8 scroll-mt-28")}>
      <SectionHeader
        icon={Diff}
        eyebrow={t("di.changes.eyebrow")}
        title={changedFacts.length > 0 ? t("di.changes.titleDiff") : t("di.changes.titleNone")}
        right={
          <span className="rounded-sm border border-[#333] bg-[#111] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
            {t("di.changes.count", { count: changedFacts.length })}
          </span>
        }
      />

      <div className="space-y-4">
        {timeline.length > 0 ? timeline.map((fact) => (
          <div key={`${fact.category}-${fact.entity}-${fact.label}-${fact.value}`} className="relative rounded-sm border border-[#2a2a2a] bg-[#111] p-4 pl-5">
            <div className="absolute left-0 top-4 h-[calc(100%-2rem)] w-0.5 bg-orange-500/60" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-300">
                {fact.category}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#fdfbf7]/30">
                {fact.entity === "a" ? result.entities.a.name : result.entities.b.name}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[#fdfbf7]/75">{fact.value}</p>
            {fact.previousValue && (
              <p className="mt-3 text-xs leading-relaxed text-[#fdfbf7]/35 line-through">
                {fact.previousValue}
              </p>
            )}
          </div>
        )) : (
          <div className="rounded-sm border border-emerald-500/20 bg-emerald-500/10 p-5">
            <p className="text-sm leading-relaxed text-emerald-100/75">
              {t("di.changes.empty")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

const ConfidenceHeatmapPanel = ({ result }: { result: ComparisonData }) => {
  const t = useT();
  return (
    <section id="confidence-heatmap" className={cn(panelClass, "p-6 md:p-8 scroll-mt-28")}>
      <SectionHeader icon={Gauge} eyebrow={t("di.heatmap.eyebrow")} title={t("di.heatmap.title")} />

      <div className="space-y-3">
        {result.categories.map((category) => {
          let aCount = 0;
          let aSum = 0;
          let bCount = 0;
          let bSum = 0;

          for (const fact of category.facts) {
            if (fact.entity === "a") {
              aCount++;
              aSum += fact.confidence;
            } else if (fact.entity === "b") {
              bCount++;
              bSum += fact.confidence;
            }
          }

          const aConfidence = aCount > 0 ? aSum / aCount : 0;
          const bConfidence = bCount > 0 ? bSum / bCount : 0;

          return (
            <div key={category.name} className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-[1fr_0.8fr_0.8fr]">
              <div className="col-span-2 flex min-h-14 items-center sm:col-span-1 rounded-sm border border-[#2a2a2a] bg-[#111] px-3 font-serif text-[#fdfbf7]/80">
                {category.name}
              </div>
              <HeatCell label={result.entities.a.name} confidence={aConfidence} count={aCount} />
              <HeatCell label={result.entities.b.name} confidence={bConfidence} count={bCount} />
            </div>
          );
        })}
      </div>
    </section>
  );
};

const HeatCell = ({ label, confidence, count }: { label: string; confidence: number; count: number }) => {
  const t = useT();
  const level = t(confidenceLabelKey(confidence));
  return (
    <div className={cn("min-h-14 rounded-sm border p-3", confidenceColor(confidence))}>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-[9px] font-bold uppercase tracking-widest" title={label}>{label}</span>
        <span className="font-mono text-xs">{formatPercent(confidence)}</span>
      </div>
      <p className="mt-1 text-[10px] uppercase tracking-widest opacity-70">
        {t(count === 1 ? "di.heatmap.cellSingle" : "di.heatmap.cellPlural", { level, count })}
      </p>
    </div>
  );
};

const EvidenceGraphPanel = ({ result }: { result: ComparisonData }) => {
  const t = useT();
  const facts = useMemo(() => allFacts(result).slice(0, 8), [result]);
  const compact = useIsMobile();
  const graph = useMemo(() => buildGraph(result, facts, compact, t), [facts, result, compact, t]);
  const [selectedId, setSelectedId] = useState(graph.nodes[0]?.id || "");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedId(graph.nodes[0]?.id || "");
  }, [graph.nodes]);

  const nodeMap = useMemo(
    () => new Map(graph.nodes.map((node) => [node.id, node])),
    [graph.nodes]
  );
  const selected = nodeMap.get(selectedId) || graph.nodes[0];

  // Compute related nodes for highlighting & dimming
  const relatedNodeIds = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const set = new Set<string>([selectedId]);
    graph.edges.forEach((edge) => {
      if (edge.from === selectedId) set.add(edge.to);
      if (edge.to === selectedId) set.add(edge.from);
    });
    return set;
  }, [graph.edges, selectedId]);

  useGSAP(() => {
    if (!containerRef.current) return;
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Staggered node entrance animation when scrolled into view
      gsap.from(".graph-node-btn", {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
          once: true,
        },
        scale: 0.85,
        opacity: 0,
        y: 14,
        stagger: 0.035,
        duration: 0.65,
        ease: "power3.out",
        clearProps: "transform,opacity",
      });
    });

    return () => mm.revert();
  }, { scope: containerRef });

  useGSAP(() => {
    if (!containerRef.current || !selectedId) return;
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Flow animation on the active dash array paths
      const activeLines = gsap.utils.toArray(".graph-active-line");
      if (activeLines.length) {
        gsap.fromTo(
          activeLines,
          { strokeDashoffset: 10 },
          { strokeDashoffset: 0, duration: 0.8, repeat: -1, ease: "none" },
        );
      }
    });

    return () => mm.revert();
  }, { scope: containerRef, dependencies: [selectedId] });

  return (
    <section ref={containerRef} id="evidence-graph" className={cn(panelClass, "overflow-hidden scroll-mt-28")}>
      <div className="p-6 md:p-8">
        <SectionHeader icon={Network} eyebrow={t("di.graph.eyebrow")} title={t("di.graph.title")} />
      </div>

      <div className="grid gap-0 border-t border-[#2a2a2a] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 bg-[#080807] p-4 sm:p-6 space-y-5">
          {(["verdict", "entity", "dimension", "fact", "source"] as const).map((tierType) => {
            const tierNodes = graph.nodes.filter((n) => n.type === tierType);
            if (tierNodes.length === 0) return null;
            return (
              <div key={tierType} className="space-y-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#fdfbf7]/35">
                  {t(GRAPH_NODE_TYPE_KEYS[tierType])}
                </p>
                <div
                  className={cn(
                    "grid gap-2",
                    tierType === "verdict" && "grid-cols-1",
                    tierType === "entity" && "grid-cols-2",
                    tierType === "dimension" && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                    tierType === "fact" && "grid-cols-1 sm:grid-cols-2",
                    tierType === "source" && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                  )}
                >
                  {tierNodes.map((node) => {
                    const isSelected = selectedId === node.id;
                    const isRelated = relatedNodeIds.has(node.id);
                    const isDimmed = Boolean(selectedId) && !isRelated;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => setSelectedId(node.id)}
                        className={cn(
                          "graph-node-btn min-w-0 rounded-lg border bg-[#111]/95 px-3 py-2.5 text-left transition-colors hover:border-orange-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400",
                          isSelected
                            ? "border-orange-500/70 bg-orange-500/10 ring-1 ring-orange-500/30"
                            : isRelated
                              ? "border-white/20 bg-white/[0.04]"
                              : "border-[#262626]",
                          isDimmed ? "opacity-40 hover:opacity-90" : "opacity-100",
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: node.color }}
                          />
                          <span className="truncate text-[9px] font-bold uppercase tracking-widest" style={{ color: node.color }}>
                            {t(GRAPH_NODE_TYPE_KEYS[node.type])}
                          </span>
                        </div>
                        <span className="mt-1 block truncate text-xs font-medium text-[#fdfbf7]" title={node.label}>
                          {node.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <aside className="min-w-0 border-t border-[#2a2a2a] bg-[#0c0b0a] p-5 sm:p-6 xl:border-l xl:border-t-0">
          {selected ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400">
                {t(GRAPH_NODE_TYPE_KEYS[selected.type])}
              </p>
              <h4 className="mt-2 font-serif text-xl sm:text-2xl text-[#fdfbf7] break-words">{selected.label}</h4>
              <p className="mt-3 text-sm leading-relaxed text-[#fdfbf7]/65 break-words">{selected.detail}</p>
            </>
          ) : null}
        </aside>
      </div>
    </section>
  );
};

const buildGraph = (result: ComparisonData, facts: FactWithCategory[], compact: boolean, t: TFunction) => {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const sourceMap = new Map<string, ComparisonSource>();

  result.sources.slice(0, 5).forEach((source) => {
    sourceMap.set(sourceKey(source), source);
  });

  // Pre-compute maps to replace O(N^2) lookups with O(N) hash map lookups
  const categoryIndexMap = new Map<string, number>();
  result.categories.slice(0, 5).forEach((cat, index) => categoryIndexMap.set(cat.name, index));

  const sourceIndexByUrl = new Map<string, number>();
  const sourceIndexByTitle = new Map<string, number>();
  const sourceIndexByHostname = new Map<string, number>();

  Array.from(sourceMap.values()).slice(0, 5).forEach((source, index) => {
    sourceIndexByUrl.set(source.url, index);
    if (source.title) sourceIndexByTitle.set(source.title, index);
    const host = safeHostname(source.url);
    if (host) sourceIndexByHostname.set(host, index);
  });

  nodes.push({
    id: "verdict",
    type: "verdict",
    label: result.verdict.bestOverall || t("di.graph.fallbackVerdict"),
    detail: result.verdict.summary,
    x: 50,
    y: 9,
    color: "#f97316",
  });

  nodes.push({
    id: "entity-a",
    type: "entity",
    label: result.entities.a.name,
    detail: result.entities.a.subtitle || t("di.graph.entityA"),
    x: 18,
    y: 22,
    color: result.entities.a.hex,
  });
  nodes.push({
    id: "entity-b",
    type: "entity",
    label: result.entities.b.name,
    detail: result.entities.b.subtitle || t("di.graph.entityB"),
    x: 82,
    y: 22,
    color: result.entities.b.hex,
  });

  result.categories.slice(0, 5).forEach((category, index) => {
    const id = `dimension-${index}`;
    nodes.push({
      id,
      type: "dimension",
      label: category.name,
      detail: category.verdict,
      x: 50,
      y: 24 + index * 11,
      color: "#fdfbf7",
    });
    edges.push({ from: "verdict", to: id, color: "#f97316" });
  });

  facts.forEach((fact, index) => {
    const id = `fact-${index}`;
    const entityId = fact.entity === "a" ? "entity-a" : "entity-b";
    const dimIndex = categoryIndexMap.get(fact.category) ?? -1;
    nodes.push({
      id,
      type: "fact",
      label: fact.label,
      detail: fact.value,
      x: fact.entity === "a" ? 24 : 76,
      y: 39 + index * 6.5,
      color: fact.entity === "a" ? result.entities.a.hex : result.entities.b.hex,
    });
    edges.push({ from: entityId, to: id, color: fact.entity === "a" ? result.entities.a.hex : result.entities.b.hex });
    if (dimIndex >= 0 && dimIndex < 5) {
      edges.push({ from: `dimension-${dimIndex}`, to: id, color: "#737373" });
    }
  });

  Array.from(sourceMap.values()).slice(0, 5).forEach((source, index) => {
    const id = `source-${index}`;
    nodes.push({
      id,
      type: "source",
      label: safeHostname(source.url),
      detail: source.summary || source.title || source.url,
      x: compact ? 14 + index * 18 : 18 + index * 16,
      y: compact ? (index % 2 === 0 ? 84 : 94) : 90,
      color: isOfficialSource(source) ? "#34d399" : "#fbbf24",
    });
  });

  facts.forEach((fact, factIndex) => {
    let sourceIndex = -1;
    if (fact.sourceUrl && sourceIndexByUrl.has(fact.sourceUrl)) {
      sourceIndex = sourceIndexByUrl.get(fact.sourceUrl)!;
    } else if (fact.sourceTitle && sourceIndexByTitle.has(fact.sourceTitle)) {
      sourceIndex = sourceIndexByTitle.get(fact.sourceTitle)!;
    } else if (fact.sourceUrl) {
      const factHost = safeHostname(fact.sourceUrl);
      if (factHost && sourceIndexByHostname.has(factHost)) {
        sourceIndex = sourceIndexByHostname.get(factHost)!;
      }
    }
    if (sourceIndex >= 0) {
      edges.push({ from: `fact-${factIndex}`, to: `source-${sourceIndex}`, color: "#525252" });
    }
  });

  return { nodes, edges };
};

const localizeReplayStep = (t: TFunction, raw: string | null | undefined): string => {
  const key = (raw || "").trim().toLowerCase();
  if (key.includes("parse")) return t("di.replay.step.parse");
  if (key.includes("search")) return t("di.replay.step.search");
  if (key.includes("extract") || key.includes("fact")) return t("di.replay.step.extract");
  if (key.includes("score")) return t("di.replay.step.score");
  if (key.includes("reason") || key.includes("verdict") || key.includes("dimension")) return t("di.replay.step.verdict");
  return raw || t("di.replay.step.parse");
};

const ResearchReplayPanel = ({
  result,
  activity,
}: {
  result: ComparisonData;
  activity: ComparisonActivityStep[];
}) => {
  const t = useT();
  const replaySteps = useMemo(() => {
    if (activity.length > 0) return activity;
    return synthesizeReplay(result, t);
  }, [activity, result, t]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex((current) => Math.min(current, Math.max(0, replaySteps.length - 1)));
  }, [replaySteps.length]);

  const active = replaySteps[index];

  if (!active) return null;

  return (
    <section id="research-replay" className={cn(panelClass, "p-6 md:p-8 scroll-mt-28")}>
      <SectionHeader
        icon={Activity}
        eyebrow={t("di.replay.eyebrow")}
        title={t("di.replay.title")}
        right={
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
            <span>{index + 1}</span>
            <span>/</span>
            <span>{replaySteps.length}</span>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="min-w-0 rounded-sm border border-[#2a2a2a] bg-[#111] p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400">
            {localizeReplayStep(t, active.task)}
          </p>
          <h4 className="mt-2 font-serif text-2xl sm:text-3xl text-[#fdfbf7] break-words">
            {localizeReplayStep(t, active.stepName)}
          </h4>
          <p className="mt-4 text-sm leading-relaxed text-[#fdfbf7]/65 break-words">
            {active.outputSummary || active.inputSummary || active.error || t("di.replay.collecting")}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <StatusBadge status={active.status} />
            {typeof active.durationMs === "number" && (
              <span className="rounded-sm border border-[#333] bg-[#0c0b0a] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
                {(active.durationMs / 1000).toFixed(1)}s
              </span>
            )}
            {active.estimatedCost !== null && active.estimatedCost !== undefined && (
              <span className="rounded-sm border border-[#333] bg-[#0c0b0a] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
                ${active.estimatedCost.toFixed(4)}
              </span>
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-5">
          <input
            type="range"
            min="0"
            max={Math.max(0, replaySteps.length - 1)}
            value={index}
            onChange={(event) => setIndex(Number(event.target.value))}
            className="w-full accent-orange-500"
          />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {replaySteps.map((step, stepIndex) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setIndex(stepIndex)}
                className={cn(
                  "min-w-0 rounded-lg border p-3 text-left transition-colors",
                  stepIndex === index
                    ? "border-orange-500/50 bg-orange-500/10"
                    : "border-[#2a2a2a] bg-[#111] hover:border-[#444]",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/35">
                    {String(stepIndex + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      step.status === "completed" ? "bg-emerald-400" : step.status === "failed" ? "bg-red-400" : "bg-orange-400",
                    )}
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-2 line-clamp-2 text-xs sm:text-sm font-serif text-[#fdfbf7]">
                  {localizeReplayStep(t, step.stepName)}
                </p>
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-[#fdfbf7]/45 break-words">
                  {statusLabel(t, step.status)}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const synthesizeReplay = (result: ComparisonData, t: TFunction): ComparisonActivityStep[] => {
  const now = result.updatedAt || new Date().toISOString();
  return [
    {
      id: "synthetic-parse",
      task: "parse",
      stepName: t("di.replay.step.parse"),
      status: "completed",
      startedAt: now,
      completedAt: now,
      durationMs: null,
      inputSummary: result.query,
      outputSummary: t("di.replay.vs", { a: result.entities.a.name, b: result.entities.b.name }),
      error: null,
    },
    {
      id: "synthetic-sources",
      task: "search",
      stepName: t("di.replay.step.search"),
      status: "completed",
      startedAt: now,
      completedAt: now,
      durationMs: null,
      inputSummary: t("di.replay.sourcesReviewed", { count: result.sourceCount }),
      outputSummary: result.sources.slice(0, 3).map((source) => safeHostname(source.url)).join(", "),
      error: null,
    },
    {
      id: "synthetic-facts",
      task: "extract",
      stepName: t("di.replay.step.extract"),
      status: "completed",
      startedAt: now,
      completedAt: now,
      durationMs: null,
      inputSummary: t("di.replay.factsCount", { count: allFacts(result).length }),
      outputSummary: t("di.replay.dimensionsCount", { count: result.categories.length }),
      error: null,
    },
    {
      id: "synthetic-score",
      task: "score",
      stepName: t("di.replay.step.score"),
      status: "completed",
      startedAt: now,
      completedAt: now,
      durationMs: null,
      inputSummary: t("di.replay.scoreInput"),
      outputSummary: result.dimensions?.map((dimension) => dimension.subject).slice(0, 4).join(", ") || t("di.replay.scoreFallback"),
      error: null,
    },
    {
      id: "synthetic-verdict",
      task: "reason",
      stepName: t("di.replay.step.verdict"),
      status: "completed",
      startedAt: now,
      completedAt: now,
      durationMs: null,
      inputSummary: t("di.replay.verdictInput"),
      outputSummary: result.verdict.summary,
      error: null,
    },
  ];
};

const StatusBadge = ({ status }: { status: string }) => {
  const t = useT();
  return (
    <span className={cn(
      "rounded-sm border px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest",
      status === "completed" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
      status === "running" && "border-orange-500/20 bg-orange-500/10 text-orange-300",
      status === "failed" && "border-red-500/20 bg-red-500/10 text-red-300",
      !["completed", "running", "failed"].includes(status) && "border-[#333] bg-[#111] text-[#fdfbf7]/40",
    )}>
      {statusLabel(t, status)}
    </span>
  );
};

const SourceQualityPanel = ({ result }: { result: ComparisonData }) => {
  const t = useT();
  const [mode, setMode] = useState<"balanced" | "official" | "recent" | "community" | "contradictions">("balanced");
  const quality = useMemo(() => sourceQualitySummary(result.sources), [result.sources]);
  const sources = useMemo(() => {
    if (mode === "balanced") return result.sources;
    if (mode === "official") return result.sources.filter(isOfficialSource);
    if (mode === "recent") return result.sources.filter(isRecentSource);
    if (mode === "community") return result.sources.filter((source) => !isOfficialSource(source));
    return [];
  }, [mode, result.sources]);

  return (
    <section id="source-quality" className={cn(panelClass, "p-6 md:p-8 scroll-mt-28")}>
      <SectionHeader icon={BookOpenCheck} eyebrow={t("di.sources.eyebrow")} title={t("di.sources.title")} />

      <div className="mb-5 grid grid-cols-3 gap-2">
        {[
          { label: t("di.sources.metric.quality"), value: quality.score ? `${quality.score}/100` : "—" },
          { label: t("di.sources.metric.official"), value: `${quality.official}%` },
          { label: t("di.sources.metric.fresh"), value: `${quality.recent}%` },
        ].map((metric) => (
          <div key={metric.label} className="min-w-0 rounded-sm border border-[#2a2a2a] bg-[#111] p-2.5 sm:p-3">
            <p className="truncate text-[8px] font-bold uppercase tracking-wider text-[#fdfbf7]/40" title={metric.label}>{metric.label}</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-[#fdfbf7]">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {(["balanced", "official", "recent", "community", "contradictions"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={cn(
              "rounded-md border px-2.5 py-2 text-[9px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap",
              mode === item
                ? "border-orange-500/50 bg-orange-500/10 text-orange-300"
                : "border-[#333] bg-[#111] text-[#fdfbf7]/50 hover:border-[#555]",
            )}
          >
            {t(SOURCE_MODE_KEYS[item])}
          </button>
        ))}
      </div>

      {mode === "contradictions" ? (
        <div className="space-y-3">
          {(result.contradictions?.length ? result.contradictions : [t("di.sources.noContradictions")]).map((item) => (
            <div key={item} className="rounded-sm border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-relaxed text-amber-100/75">
              {item}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {sources.slice(0, 6).map((source) => (
            <a
              key={sourceKey(source)}
              href={safeHref(source.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-sm border border-[#2a2a2a] bg-[#111] p-4 transition-colors hover:border-orange-500/40"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="line-clamp-2 text-sm font-serif text-[#fdfbf7]">{source.title || safeHostname(source.url)}</p>
                <span className={cn(
                  "shrink-0 rounded-sm border px-2 py-1 text-[8px] font-bold uppercase tracking-widest",
                  isOfficialSource(source)
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                    : "border-amber-500/20 bg-amber-500/10 text-amber-300",
                )}>
                  {source.reliability === "Official"
                    ? t("di.sources.mode.official")
                    : source.reliability === "Community"
                      ? t("di.sources.mode.community")
                      : source.reliability}
                </span>
              </div>
              <p className="mt-2 truncate text-[10px] uppercase tracking-widest text-[#fdfbf7]/30">
                {safeHostname(source.url)}
              </p>
            </a>
          ))}
          {sources.length === 0 && (
            <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-5 text-sm text-[#fdfbf7]/45">
              {t("di.sources.noMatch")}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

type DecisionBoardRecord = {
  id: string;
  comparisonId: string;
  query: string;
  winner: string;
  savedAt: string;
};

const boardStorageKey = "sideby:decision-board:v1";

const DecisionBoardPanel = ({
  result,
  comparisonId,
}: {
  result: ComparisonData;
  comparisonId: string;
}) => {
  const { t, lang } = useI18n();
  const [records, setRecords] = useState<DecisionBoardRecord[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(boardStorageKey) || "[]") as DecisionBoardRecord[];
      setRecords(Array.isArray(parsed) ? parsed : []);
    } catch {
      setRecords([]);
    }
  }, []);

  const saveToBoard = () => {
    const record: DecisionBoardRecord = {
      id: result.slug,
      comparisonId,
      query: result.query,
      winner: result.verdict.bestOverall || t("di.board.fallbackWinner"),
      savedAt: new Date().toISOString(),
    };
    const next = [record, ...records.filter((item) => item.id !== record.id)].slice(0, 8);
    setRecords(next);
    window.localStorage.setItem(boardStorageKey, JSON.stringify(next));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  return (
    <section id="decision-board" className={cn(panelClass, "p-6 md:p-8 scroll-mt-28")}>
      <SectionHeader
        icon={Clipboard}
        eyebrow={t("di.board.eyebrow")}
        title={t("di.board.title")}
        right={
          <button
            type="button"
            onClick={saveToBoard}
            className="inline-flex h-10 items-center gap-2 rounded-sm border border-[#333] bg-[#111] px-3 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60 transition-colors hover:border-orange-500/40 hover:text-orange-400"
          >
            {saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <GitBranch className="h-3.5 w-3.5" />}
            {saved ? t("di.board.saved") : t("di.board.save")}
          </button>
        }
      />

      <div className="space-y-3">
        <div className="rounded-sm border border-orange-500/20 bg-orange-500/10 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-300/70">
            {t("di.board.active")}
          </p>
          <p className="mt-2 font-serif text-xl text-[#fdfbf7]">{result.query}</p>
          <p className="mt-2 text-sm text-[#fdfbf7]/60">{result.verdict.bestOverall || t("di.board.fallbackActive")}</p>
        </div>

        {records.length > 0 ? records.map((record) => (
          <div key={record.id} className="rounded-sm border border-[#2a2a2a] bg-[#111] p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="line-clamp-2 text-sm font-serif text-[#fdfbf7]">{record.query}</p>
              <Trophy className="h-4 w-4 shrink-0 text-orange-400" />
            </div>
            <p className="mt-2 text-[10px] uppercase tracking-widest text-[#fdfbf7]/35">
              {record.winner} | {formatDate(record.savedAt, lang)}
            </p>
          </div>
        )) : (
          <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-5 text-sm leading-relaxed text-[#fdfbf7]/45">
            {t("di.board.empty")}
          </div>
        )}
      </div>
    </section>
  );
};
