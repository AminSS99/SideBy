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
} from "lucide-react";
import { cn } from "@/lib/utils";
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

const confidenceLabel = (value: number) => {
  if (value >= 0.82) return "Strong";
  if (value >= 0.64) return "Watch";
  return "Thin";
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

const allFacts = (result: ComparisonData): FactWithCategory[] =>
  result.categories.flatMap((category) =>
    category.facts.map((fact) => ({
      ...fact,
      category: category.name,
    })),
  );

const averageConfidence = (facts: ComparisonFact[]) => {
  if (facts.length === 0) return 0;
  return facts.reduce((sum, fact) => sum + fact.confidence, 0) / facts.length;
};

const categoryScore = (category: Category, entity: EntityKey) => {
  if (category.winner === "tie") return 68;
  if (category.winner === entity) return 82;
  return 54;
};

const buildMetrics = (result: ComparisonData): DecisionMetric[] => {
  if (result.dimensions?.length) {
    return result.dimensions.map((dimension) => ({
      subject: dimension.subject,
      a: dimension.a,
      b: dimension.b,
    }));
  }

  return result.categories.map((category) => ({
    subject: category.name,
    a: categoryScore(category, "a"),
    b: categoryScore(category, "b"),
  }));
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

  let totalScore = 0, officialCount = 0, recentCount = 0;

  for (const source of sources) {
    const isOfficial = isOfficialSource(source);
    const isRecent = isRecentSource(source);

    if (isOfficial) officialCount++;
    if (isRecent) recentCount++;

    const evidenceConfidence = source.confidence ?? 0.75;
    const freshnessWeight = isRecent ? 1 : 0.85;
    totalScore += sourceQualityWeight(source) * evidenceConfidence * freshnessWeight;
  }

  return {
    score: Math.round((totalScore / sources.length) * 100),
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
      <div className="grid gap-6 lg:grid-cols-2">
        <ChangeTimelinePanel result={result} />
        <ConfidenceHeatmapPanel result={result} />
      </div>
      <EvidenceGraphPanel result={result} />
      <ResearchReplayPanel result={result} activity={activity} />
      <div className="grid gap-6 lg:grid-cols-2">
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
  <div className="mb-6 flex flex-col gap-4 border-b border-[#2a2a2a] pb-5 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-[#333] bg-[#111] text-orange-400">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500/60">
          {eyebrow}
        </p>
        <h3 className="mt-1 font-serif text-2xl tracking-tight text-[#fdfbf7]">
          {title}
        </h3>
      </div>
    </div>
    {right}
  </div>
);

const ExecutiveBriefPanel = ({ result }: { result: ComparisonData }) => {
  const [copied, setCopied] = useState(false);
  const topCategories = result.categories.slice(0, 4);
  const citedSources = result.sources.slice(0, 4);
  const memo = useMemo(() => {
    const categoryLines = topCategories
      .map((category) => {
        const winner =
          category.winner === "tie"
            ? "Tie"
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
      `Recommendation: ${result.verdict.bestOverall || "Review the weighted result"}`,
      "",
      result.verdict.summary,
      "",
      "Decision signals:",
      categoryLines || "- No category-level signal available.",
      "",
      "What could change the recommendation:",
      result.contradictions?.length
        ? result.contradictions.map((item) => `- ${item}`).join("\n")
        : "- A material pricing, performance, or evidence-quality change in monitored sources.",
      "",
      "Sources:",
      sourceLines || "- No sources attached.",
    ].join("\n");
  }, [citedSources, result, topCategories]);

  const copyMemo = async () => {
    const ok = await copyText(memo);
    setCopied(ok);
    if (ok) window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section id="executive-brief" className={cn(panelClass, "p-6 md:p-8 scroll-mt-28")}>
      <SectionHeader
        icon={FileText}
        eyebrow="Executive brief"
        title="Decision memo"
        right={
          <button
            type="button"
            onClick={() => void copyMemo()}
            className="inline-flex h-10 items-center gap-2 rounded-sm border border-[#333] bg-[#111] px-3 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60 transition-colors hover:border-orange-500/40 hover:text-orange-400"
          >
            {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy memo"}
          </button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-sm border border-orange-500/20 bg-orange-500/10 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-300/70">
            Current recommendation
          </p>
          <p className="mt-3 font-serif text-3xl leading-tight text-[#fdfbf7]">
            {result.verdict.bestOverall || "Evidence-weighted review"}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[#fdfbf7]/65">
            {result.verdict.summary}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {topCategories.map((category) => {
            const winner =
              category.winner === "tie"
                ? "Tie"
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
  const metrics = useMemo(() => buildMetrics(result), [result]);
  const [weights, setWeights] = useState<Record<string, number>>(() =>
    Object.fromEntries(metrics.map((metric) => [metric.subject, 1])),
  );

  useEffect(() => {
    setWeights((current) => {
      const next = Object.fromEntries(metrics.map((metric) => [metric.subject, current[metric.subject] ?? 1]));
      return next;
    });
  }, [metrics]);

  const weighted = useMemo(() => {
    let totalWeight = 0, aScore = 0, bScore = 0;
    for (const metric of metrics) {
      const w = weights[metric.subject] ?? 1;
      totalWeight += w;
      aScore += metric.a * w;
      bScore += metric.b * w;
    }
    const a = totalWeight ? aScore / totalWeight : 0;
    const b = totalWeight ? bScore / totalWeight : 0;
    return { a, b, winner: Math.abs(a - b) < 1 ? "tie" : a > b ? "a" : "b" };
  }, [metrics, weights]);

  const applyPreset = (preset: "startup" | "enterprise" | "developer" | "balanced") => {
    const next = Object.fromEntries(
      metrics.map((metric) => {
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
        return [metric.subject, value];
      }),
    );
    setWeights(next);
  };

  const winnerName =
    weighted.winner === "tie"
      ? "Tie"
      : weighted.winner === "a"
        ? result.entities.a.name
        : result.entities.b.name;

  return (
    <section id="personalized-verdict" className={cn(panelClass, "p-6 md:p-8 scroll-mt-28")}>
      <SectionHeader
        icon={SlidersHorizontal}
        eyebrow="Personalized verdict"
        title="Weight what matters"
        right={
          <div className="flex flex-wrap gap-2">
            {(["balanced", "startup", "enterprise", "developer"] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyPreset(preset)}
                className="rounded-sm border border-[#333] bg-[#111] px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/50 transition-colors hover:border-orange-500/40 hover:text-orange-400"
              >
                {preset}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/35">
            Weighted winner
          </p>
          <p className="mt-3 font-serif text-4xl text-[#fdfbf7]">{winnerName}</p>
          <div className="mt-6 space-y-4">
            <ScoreBar label={result.entities.a.name} score={weighted.a} color={result.entities.a.hex} />
            <ScoreBar label={result.entities.b.name} score={weighted.b} color={result.entities.b.hex} />
          </div>
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
  const facts = useMemo(() => allFacts(result), [result]);
  const changedFacts = facts.filter((fact) => fact.changed);
  const monitorFacts = facts.filter((fact) => fact.freshness === "Monitor").slice(0, 4);
  const timeline = changedFacts.length > 0 ? changedFacts : monitorFacts;

  return (
    <section id="changed-facts" className={cn(panelClass, "p-6 md:p-8 scroll-mt-28")}>
      <SectionHeader
        icon={Diff}
        eyebrow="Changed facts"
        title={changedFacts.length > 0 ? "Refresh diff" : "No changes detected"}
        right={
          <span className="rounded-sm border border-[#333] bg-[#111] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
            {changedFacts.length} changed
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
              The current result has no refreshed fact deltas. A future refresh will surface changed values, previous values, and monitored facts here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

const ConfidenceHeatmapPanel = ({ result }: { result: ComparisonData }) => {
  return (
    <section id="confidence-heatmap" className={cn(panelClass, "p-6 md:p-8 scroll-mt-28")}>
      <SectionHeader icon={Gauge} eyebrow="Confidence heatmap" title="Evidence strength" />

      <div className="space-y-3">
        {result.categories.map((category) => {
          let aSum = 0, aCount = 0, bSum = 0, bCount = 0;
          for (const fact of category.facts) {
            if (fact.entity === "a") { aSum += fact.confidence; aCount++; }
            else if (fact.entity === "b") { bSum += fact.confidence; bCount++; }
          }
          const aConfidence = aCount ? aSum / aCount : 0;
          const bConfidence = bCount ? bSum / bCount : 0;

          return (
            <div key={category.name} className="grid grid-cols-[1fr_0.8fr_0.8fr] gap-2 text-xs">
              <div className="flex min-h-14 items-center rounded-sm border border-[#2a2a2a] bg-[#111] px-3 font-serif text-[#fdfbf7]/80">
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

const HeatCell = ({ label, confidence, count }: { label: string; confidence: number; count: number }) => (
  <div className={cn("min-h-14 rounded-sm border p-3", confidenceColor(confidence))}>
    <div className="flex items-center justify-between gap-2">
      <span className="truncate text-[9px] font-bold uppercase tracking-widest">{label}</span>
      <span className="font-mono text-xs">{formatPercent(confidence)}</span>
    </div>
    <p className="mt-1 text-[10px] uppercase tracking-widest opacity-70">
      {confidenceLabel(confidence)} | {count} fact{count === 1 ? "" : "s"}
    </p>
  </div>
);

const EvidenceGraphPanel = ({ result }: { result: ComparisonData }) => {
  const facts = useMemo(() => allFacts(result).slice(0, 8), [result]);
  const graph = useMemo(() => buildGraph(result, facts), [facts, result]);
  const [selectedId, setSelectedId] = useState(graph.nodes[0]?.id || "");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedId(graph.nodes[0]?.id || "");
  }, [graph.nodes]);

  const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]));
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

    // Staggered node entrance animation when scrolled into view
    gsap.from(".graph-node-btn", {
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 85%",
      },
      scale: 0.8,
      opacity: 0,
      y: 15,
      stagger: 0.04,
      duration: 0.8,
      ease: "back.out(1.5)",
    });
  }, { scope: containerRef });

  useGSAP(() => {
    if (selectedId) {
      // Flow animation on the active dash array paths
      const activeLines = gsap.utils.toArray(".graph-active-line");
      if (activeLines.length) {
        gsap.fromTo(activeLines,
          { strokeDashoffset: 10 },
          { strokeDashoffset: 0, duration: 0.8, repeat: -1, ease: "none" }
        );
      }
    }
  }, [selectedId]);

  return (
    <section ref={containerRef} id="evidence-graph" className={cn(panelClass, "overflow-hidden scroll-mt-28")}>
      <div className="p-6 md:p-8">
        <SectionHeader icon={Network} eyebrow="Evidence graph" title="Claim to source map" />
      </div>

      <div className="grid gap-0 border-t border-[#2a2a2a] xl:grid-cols-[1fr_300px]">
        <div className="relative min-h-[540px] overflow-hidden bg-[#080807]">
          <svg className="absolute inset-0 h-full w-full" role="presentation">
            {graph.edges.map((edge, index) => {
              const from = nodeMap.get(edge.from);
              const to = nodeMap.get(edge.to);
              if (!from || !to) return null;

              const isActiveEdge = edge.from === selectedId || edge.to === selectedId;
              const isDimmedEdge = selectedId && !isActiveEdge;

              return (
                <line
                  key={`${edge.from}-${edge.to}-${index}`}
                  x1={`${from.x}%`}
                  y1={`${from.y}%`}
                  x2={`${to.x}%`}
                  y2={`${to.y}%`}
                  stroke={isActiveEdge ? "#ea580c" : edge.color}
                  strokeOpacity={isActiveEdge ? "0.9" : isDimmedEdge ? "0.08" : "0.28"}
                  strokeWidth={isActiveEdge ? "1.5" : "1"}
                  strokeDasharray={isActiveEdge ? "5 5" : undefined}
                  className={cn(
                    "transition-all duration-300",
                    isActiveEdge && "graph-active-line"
                  )}
                />
              );
            })}
          </svg>

          {graph.nodes.map((node) => {
            const isDimmed = selectedId && !relatedNodeIds.has(node.id);
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedId(node.id)}
                className={cn(
                  "absolute max-w-[170px] -translate-x-1/2 -translate-y-1/2 rounded-sm border bg-[#111]/95 px-3 py-2 text-left shadow-2xl transition-all hover:z-20 hover:border-orange-500/50 graph-node-btn",
                  selectedId === node.id ? "z-20 border-orange-500/60 scale-105" : "z-10 border-[#333]",
                  isDimmed ? "opacity-35 hover:opacity-85 scale-95" : "opacity-100"
                )}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                <span className="block text-[8px] font-bold uppercase tracking-widest" style={{ color: node.color }}>
                  {node.type}
                </span>
                <span className="mt-1 block truncate text-xs font-medium text-[#fdfbf7]">
                  {node.label}
                </span>
              </button>
            );
          })}
        </div>

        <aside className="border-t border-[#2a2a2a] bg-[#0c0b0a] p-6 xl:border-l xl:border-t-0">
          {selected ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400">
                {selected.type}
              </p>
              <h4 className="mt-2 font-serif text-2xl text-[#fdfbf7]">{selected.label}</h4>
              <p className="mt-4 text-sm leading-relaxed text-[#fdfbf7]/60">{selected.detail}</p>
            </>
          ) : null}
        </aside>
      </div>
    </section>
  );
};

const buildGraph = (result: ComparisonData, facts: FactWithCategory[]) => {
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
    label: result.verdict.bestOverall || "Verdict",
    detail: result.verdict.summary,
    x: 50,
    y: 9,
    color: "#f97316",
  });

  nodes.push({
    id: "entity-a",
    type: "entity",
    label: result.entities.a.name,
    detail: result.entities.a.subtitle || "First comparison entity",
    x: 18,
    y: 22,
    color: result.entities.a.hex,
  });
  nodes.push({
    id: "entity-b",
    type: "entity",
    label: result.entities.b.name,
    detail: result.entities.b.subtitle || "Second comparison entity",
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
      x: 18 + index * 16,
      y: 90,
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

const ResearchReplayPanel = ({
  result,
  activity,
}: {
  result: ComparisonData;
  activity: ComparisonActivityStep[];
}) => {
  const replaySteps = useMemo(() => {
    if (activity.length > 0) return activity;
    return synthesizeReplay(result);
  }, [activity, result]);
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
        eyebrow="Research replay"
        title="Scrub the run"
        right={
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
            <span>{index + 1}</span>
            <span>/</span>
            <span>{replaySteps.length}</span>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400">
            {active.task}
          </p>
          <h4 className="mt-2 font-serif text-3xl text-[#fdfbf7]">{active.stepName}</h4>
          <p className="mt-4 text-sm leading-relaxed text-[#fdfbf7]/60">
            {active.outputSummary || active.inputSummary || active.error || "Step telemetry is being collected."}
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

        <div className="space-y-5">
          <input
            type="range"
            min="0"
            max={Math.max(0, replaySteps.length - 1)}
            value={index}
            onChange={(event) => setIndex(Number(event.target.value))}
            className="w-full accent-orange-500"
          />
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {replaySteps.map((step, stepIndex) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setIndex(stepIndex)}
                className={cn(
                  "min-h-24 rounded-sm border p-3 text-left transition-colors",
                  stepIndex === index
                    ? "border-orange-500/50 bg-orange-500/10"
                    : "border-[#2a2a2a] bg-[#111] hover:border-[#444]",
                )}
              >
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/35">
                  {String(stepIndex + 1).padStart(2, "0")}
                </p>
                <p className="mt-2 truncate text-sm font-serif text-[#fdfbf7]">{step.stepName}</p>
                <p className="mt-1 truncate text-[10px] uppercase tracking-widest text-[#fdfbf7]/30">{step.status}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const synthesizeReplay = (result: ComparisonData): ComparisonActivityStep[] => {
  const now = result.updatedAt || new Date().toISOString();
  return [
    {
      id: "synthetic-parse",
      task: "parse",
      stepName: "Query parsing",
      status: "completed",
      startedAt: now,
      completedAt: now,
      durationMs: null,
      inputSummary: result.query,
      outputSummary: `${result.entities.a.name} vs ${result.entities.b.name}`,
      error: null,
    },
    {
      id: "synthetic-sources",
      task: "search",
      stepName: "Source discovery",
      status: "completed",
      startedAt: now,
      completedAt: now,
      durationMs: null,
      inputSummary: `${result.sourceCount} sources reviewed`,
      outputSummary: result.sources.slice(0, 3).map((source) => safeHostname(source.url)).join(", "),
      error: null,
    },
    {
      id: "synthetic-facts",
      task: "extract",
      stepName: "Fact extraction",
      status: "completed",
      startedAt: now,
      completedAt: now,
      durationMs: null,
      inputSummary: `${allFacts(result).length} facts`,
      outputSummary: `${result.categories.length} comparison dimensions`,
      error: null,
    },
    {
      id: "synthetic-score",
      task: "score",
      stepName: "Dimension scoring",
      status: "completed",
      startedAt: now,
      completedAt: now,
      durationMs: null,
      inputSummary: "Evidence-weighted scoring",
      outputSummary: result.dimensions?.map((dimension) => dimension.subject).slice(0, 4).join(", ") || "Category scores",
      error: null,
    },
    {
      id: "synthetic-verdict",
      task: "reason",
      stepName: "Verdict synthesis",
      status: "completed",
      startedAt: now,
      completedAt: now,
      durationMs: null,
      inputSummary: "Scores, facts, and contradictions",
      outputSummary: result.verdict.summary,
      error: null,
    },
  ];
};

const StatusBadge = ({ status }: { status: string }) => (
  <span className={cn(
    "rounded-sm border px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest",
    status === "completed" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    status === "running" && "border-orange-500/20 bg-orange-500/10 text-orange-300",
    status === "failed" && "border-red-500/20 bg-red-500/10 text-red-300",
    !["completed", "running", "failed"].includes(status) && "border-[#333] bg-[#111] text-[#fdfbf7]/40",
  )}>
    {status}
  </span>
);

const SourceQualityPanel = ({ result }: { result: ComparisonData }) => {
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
      <SectionHeader icon={BookOpenCheck} eyebrow="Source quality mode" title="Trust filters" />

      <div className="mb-5 grid grid-cols-3 gap-2">
        {[
          { label: "Quality", value: quality.score ? `${quality.score}/100` : "—" },
          { label: "Official", value: `${quality.official}%` },
          { label: "Fresh ≤30d", value: `${quality.recent}%` },
        ].map((metric) => (
          <div key={metric.label} className="rounded-sm border border-[#2a2a2a] bg-[#111] p-3">
            <p className="text-[8px] font-bold uppercase tracking-widest text-[#fdfbf7]/35">{metric.label}</p>
            <p className="mt-1 text-sm font-semibold text-[#fdfbf7]">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {(["balanced", "official", "recent", "community", "contradictions"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={cn(
              "rounded-sm border px-3 py-2 text-[9px] font-bold uppercase tracking-widest transition-colors",
              mode === item
                ? "border-orange-500/50 bg-orange-500/10 text-orange-300"
                : "border-[#333] bg-[#111] text-[#fdfbf7]/45 hover:border-[#555]",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {mode === "contradictions" ? (
        <div className="space-y-3">
          {(result.contradictions?.length ? result.contradictions : ["No contradictions were saved for this run."]).map((item) => (
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
              href={source.url}
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
                  {source.reliability}
                </span>
              </div>
              <p className="mt-2 truncate text-[10px] uppercase tracking-widest text-[#fdfbf7]/30">
                {safeHostname(source.url)}
              </p>
            </a>
          ))}
          {sources.length === 0 && (
            <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-5 text-sm text-[#fdfbf7]/45">
              No sources match this mode.
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
      winner: result.verdict.bestOverall || "Review",
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
        eyebrow="Decision board"
        title="Comparison collection"
        right={
          <button
            type="button"
            onClick={saveToBoard}
            className="inline-flex h-10 items-center gap-2 rounded-sm border border-[#333] bg-[#111] px-3 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60 transition-colors hover:border-orange-500/40 hover:text-orange-400"
          >
            {saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <GitBranch className="h-3.5 w-3.5" />}
            {saved ? "Saved" : "Save"}
          </button>
        }
      />

      <div className="space-y-3">
        <div className="rounded-sm border border-orange-500/20 bg-orange-500/10 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-300/70">
            Active decision
          </p>
          <p className="mt-2 font-serif text-xl text-[#fdfbf7]">{result.query}</p>
          <p className="mt-2 text-sm text-[#fdfbf7]/60">{result.verdict.bestOverall || "Evidence review"}</p>
        </div>

        {records.length > 0 ? records.map((record) => (
          <div key={record.id} className="rounded-sm border border-[#2a2a2a] bg-[#111] p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="line-clamp-2 text-sm font-serif text-[#fdfbf7]">{record.query}</p>
              <Trophy className="h-4 w-4 shrink-0 text-orange-400" />
            </div>
            <p className="mt-2 text-[10px] uppercase tracking-widest text-[#fdfbf7]/35">
              {record.winner} | {new Date(record.savedAt).toLocaleDateString()}
            </p>
          </div>
        )) : (
          <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-5 text-sm leading-relaxed text-[#fdfbf7]/45">
            Save this comparison to start a lightweight decision collection in this browser.
          </div>
        )}
      </div>
    </section>
  );
};
