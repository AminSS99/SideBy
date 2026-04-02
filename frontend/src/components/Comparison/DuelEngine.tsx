import React, { useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "../GlassCard";
import { Zap, ArrowLeftRight, BrainCircuit, ShieldAlert, Swords, Target } from "lucide-react";
import { ComparisonSkeleton, LoadingMessage } from "./ComparisonSkeleton";
import ComparisonResults from "./ComparisonResults";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buildApiUrl, envConfig } from "@/config/env";
import { categoryConfigs } from "@/config/categoryConfig";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/contexts/ProjectsContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { createAiRun, updateAiRun } from "@/lib/supabase/aiRuns";
import { toast } from "sonner";
import { sanitizeInput, validateComparisonInput } from "@/utils/optimizations";
import { Link } from "react-router-dom";

interface DuelEngineProps {
  userCredits: number;
  onSpendCredit: () => void;
}

interface CompareApiResponse {
  summary?: string;
  error?: string;
  provider?: string;
  model?: string;
  category?: string;
  fallback?: boolean;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  latencyMs?: number | null;
}

const compareModes = [
  {
    id: "balanced",
    label: "Balanced",
    description: "General-purpose comparison with even weighting.",
    icon: BrainCircuit,
  },
  {
    id: "decisive",
    label: "Decisive",
    description: "Pushes for a sharper winner with fewer ties.",
    icon: Swords,
  },
  {
    id: "risk-aware",
    label: "Risk-aware",
    description: "Optimizes for downside protection and warning signs.",
    icon: ShieldAlert,
  },
  {
    id: "goal-first",
    label: "Goal-first",
    description: "Weights the decision context and must-haves heavily.",
    icon: Target,
  },
] as const;

const analysisDepths = [
  {
    id: "quick",
    label: "Quick",
    description: "Short answer, fast decision.",
  },
  {
    id: "standard",
    label: "Standard",
    description: "Normal comparison detail.",
  },
  {
    id: "extreme",
    label: "Extreme",
    description: "Deeper tradeoffs, edge cases, and decision boundaries.",
  },
] as const;

// Category options
const categories = [
  { id: "travel", label: "Travel", icon: "🌍" },
  { id: "tech", label: "Tech", icon: "💻" },
  { id: "gaming", label: "Gaming", icon: "🎮" },
  { id: "apps", label: "Apps", icon: "📱" },
  { id: "food", label: "Food", icon: "🍔" },
  { id: "auto", label: "Auto", icon: "🚗" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "other", label: "Other", icon: "✨" },
];

const DuelEngine = ({ userCredits, onSpendCredit }: DuelEngineProps) => {
  const { user, isConfigured: isSupabaseConfigured } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { activeProject } = useProjects();

  // Input state
  const [itemA, setItemA] = useState("");
  const [itemB, setItemB] = useState("");
  const [activeCategory, setActiveCategory] = useState("travel");
  const [compareMode, setCompareMode] = useState("goal-first");
  const [analysisDepth, setAnalysisDepth] = useState("extreme");
  const [decisionContext, setDecisionContext] = useState("");
  const [priorities, setPriorities] = useState<string[]>([]);
  const [mustHaves, setMustHaves] = useState<string[]>([]);
  const [redFlags, setRedFlags] = useState("");

  // UI state
  const [isSearching, setIsSearching] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const categoryConfig = categoryConfigs[activeCategory] ?? categoryConfigs.tech;
  const highlightedMetrics = categoryConfig.metrics.slice(0, 8);

  const toggleSelection = (
    value: string,
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    limit: number,
  ) => {
    setter((existing) => {
      if (existing.includes(value)) {
        return existing.filter((entry) => entry !== value);
      }

      if (existing.length >= limit) {
        return [...existing.slice(1), value];
      }

      return [...existing, value];
    });
  };

  // Swap items
  const handleSwap = () => {
    const temp = itemA;
    setItemA(itemB);
    setItemB(temp);
    toast.success("Items swapped!");
  };

  // Start comparison
  const startComparison = async () => {
    // Sanitize inputs
    const cleanA = sanitizeInput(itemA);
    const cleanB = sanitizeInput(itemB);

    // Validate inputs
    const validation = validateComparisonInput(cleanA, cleanB);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid input");
      return;
    }

    if (userCredits <= 0) {
      toast.error("No credits remaining");
      return;
    }

    if (!envConfig.apiBaseUrl) {
      toast.error("App configuration incomplete", {
        description: "Set VITE_API_BASE_URL before running comparisons.",
      });
      return;
    }

    onSpendCredit();
    setIsSearching(true);
    setShowResult(false);
    setAiSummary(null);

    const startedAt = performance.now();
    const comparisonTitle = `${cleanA} vs ${cleanB}`;
    let trackedRunId: string | null = null;

    if (isSupabaseConfigured && user && activeWorkspace) {
      try {
        const trackedRun = await createAiRun({
          workspaceId: activeWorkspace.id,
          projectId: activeProject?.id ?? null,
          userId: user.id,
          provider: "backend-compare",
          model: "controller-managed",
          taskType: "compare",
          status: "running",
          title: comparisonTitle,
          source: "web.compare",
          inputPayload: {
            itemA: cleanA,
            itemB: cleanB,
            category: activeCategory,
            compareMode,
            analysisDepth,
            decisionContext,
            priorities,
            mustHaves,
            redFlags: redFlags
              .split(",")
              .map((flag) => flag.trim())
              .filter(Boolean),
          },
        });

        trackedRunId = trackedRun.id;
      } catch (trackingError) {
        console.error("Failed to persist AI run start.", trackingError);
      }
    }

    try {
      const response = await fetch(buildApiUrl("/api/compare"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemA: cleanA,
          itemB: cleanB,
          category: activeCategory,
          compareMode,
          decisionContext,
          priorities,
          mustHaves,
          redFlags: redFlags
            .split(",")
            .map((flag) => flag.trim())
            .filter(Boolean),
          depth: analysisDepth,
        }),
      });
      const data = (await response.json()) as CompareApiResponse;

      if (data.error) {
        throw new Error(data.error);
      }

      const latencyMs = Math.round(performance.now() - startedAt);

      setAiSummary(data.summary);
      setIsSearching(false);
      setShowResult(true);

      if (trackedRunId) {
        try {
          await updateAiRun(trackedRunId, {
            status: "completed",
            provider: data.provider ?? "backend-compare",
            model: data.model ?? "controller-managed",
            latencyMs: data.latencyMs ?? latencyMs,
            inputTokens: data.inputTokens ?? null,
            outputTokens: data.outputTokens ?? null,
            outputSummary: data.summary ?? null,
            inputPayload: {
              itemA: cleanA,
              itemB: cleanB,
              category: data.category ?? activeCategory,
              fallback: data.fallback ?? false,
              compareMode,
              analysisDepth,
              decisionContext,
              priorities,
              mustHaves,
              redFlags: redFlags
                .split(",")
                .map((flag) => flag.trim())
                .filter(Boolean),
            },
            completedAt: new Date().toISOString(),
          });
        } catch (trackingError) {
          console.error("Failed to persist AI run completion.", trackingError);
        }
      }

      toast.success("Comparison Complete!", {
        description: `${cleanA} vs ${cleanB} analyzed`,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Please try again";

      console.error("Failed to fetch:", error);
      setIsSearching(false);

      if (trackedRunId) {
        try {
          await updateAiRun(trackedRunId, {
            status: "failed",
            latencyMs: Math.round(performance.now() - startedAt),
            errorMessage: message,
            completedAt: new Date().toISOString(),
          });
        } catch (trackingError) {
          console.error("Failed to persist AI run failure.", trackingError);
        }
      }

      toast.error("Analysis failed", {
        description: message,
      });
    }
  };

  const handleSearchComplete = () => {
    setIsSearching(false);
    setShowResult(true);
  };

  const handleNewSearch = () => {
    setShowResult(false);
    setItemA("");
    setItemB("");
    setAiSummary(null);
    setDecisionContext("");
    setPriorities([]);
    setMustHaves([]);
    setRedFlags("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Premium Loading Skeleton */}
      {isSearching && (
        <>
          <LoadingMessage
            message={`Running ${analysisDepth} ${compareMode} analysis for ${itemA} vs ${itemB}...`}
          />
          <ComparisonSkeleton />
        </>
      )}

      {/* Results */}
      {showResult && (
        <ComparisonResults
          itemA={itemA}
          itemB={itemB}
          aiSummary={aiSummary}
          onSwap={handleSwap}
          onNewSearch={handleNewSearch}
        />
      )}

      {/* Input Form - Hide when showing results */}
      {!showResult && !isSearching && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Category Selector */}
          <div className="flex justify-center flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeCategory === cat.id
                    ? "bg-purple-600 text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Main Comparison Input */}
          <GlassCard className="max-w-3xl mx-auto p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black tracking-tight mb-2">
                What do you want to compare?
              </h2>
              <p className="text-white/50 text-sm">
                Enter any two items, products, cities, or services
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* Item A Input */}
              <div className="flex-1 w-full">
                <Input
                  value={itemA}
                  onChange={(e) => setItemA(e.target.value)}
                  placeholder="e.g., Paris"
                  className="h-14 text-lg bg-white/5 border-white/10 text-center"
                />
              </div>

              {/* VS / Swap */}
              <div className="flex items-center gap-2">
                <span className="text-white/30 font-black text-xl">VS</span>
                <Button
                  onClick={handleSwap}
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-white/10"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Item B Input */}
              <div className="flex-1 w-full">
                <Input
                  value={itemB}
                  onChange={(e) => setItemB(e.target.value)}
                  placeholder="e.g., London"
                  className="h-14 text-lg bg-white/5 border-white/10 text-center"
                />
              </div>
            </div>

            {/* Compare Button */}
            <div className="mt-8 text-center">
              <Button
                onClick={startComparison}
                disabled={!itemA.trim() || !itemB.trim() || userCredits <= 0}
                className="h-14 px-12 text-lg font-black bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-700 hover:to-emerald-600 rounded-full"
              >
                <Zap className="w-5 h-5 mr-2" />
                COMPARE NOW
              </Button>

              {userCredits <= 0 && (
                <p className="mt-4 text-red-400 text-xs">
                  No credits remaining. Upgrade to continue.
                </p>
              )}

              {user && activeWorkspace && (
                <p className="mt-4 text-xs text-white/45">
                  This comparison will be tracked in{" "}
                  <span className="font-semibold text-white">
                    {activeWorkspace.name}
                  </span>
                  {activeProject ? (
                    <>
                      {" "}under{" "}
                      <span className="font-semibold text-emerald-300">
                        {activeProject.name}
                      </span>
                      .
                    </>
                  ) : (
                    <>
                      {" "}without a project. Assign one in{" "}
                      <Link
                        to="/app/projects"
                        className="text-emerald-300 underline underline-offset-4"
                      >
                        Projects
                      </Link>
                      .
                    </>
                  )}
                </p>
              )}
            </div>
          </GlassCard>

          <GlassCard className="mx-auto max-w-5xl rounded-[32px] p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-400">
                  Extreme Engine
                </p>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-white">
                  Force the comparison to match the real decision
                </h3>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/55">
                  Tune the judgment style, choose the metrics that matter, and feed the
                  engine the constraints it should treat as non-negotiable.
                </p>
              </div>
              <div className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                {categoryConfig.label} lens
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-4">
              {compareModes.map((mode) => {
                const isActive = compareMode === mode.id;

                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setCompareMode(mode.id)}
                    className={[
                      "rounded-[28px] border p-5 text-left transition-colors",
                      isActive
                        ? "border-emerald-400/50 bg-emerald-400/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]",
                    ].join(" ")}
                  >
                    <mode.icon className="h-5 w-5 text-emerald-300" />
                    <p className="mt-4 text-lg font-bold text-white">{mode.label}</p>
                    <p className="mt-2 text-sm text-white/55">{mode.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-white">Decision context</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/35">
                    What outcome are you optimizing for?
                  </p>
                  <Textarea
                    value={decisionContext}
                    onChange={(event) => setDecisionContext(event.target.value)}
                    placeholder="Example: I need the better choice for a small team shipping in 30 days with low tolerance for maintenance risk."
                    className="mt-3 min-h-28 border-white/10 bg-black/30 text-white"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">Priority metrics</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/35">
                    Pick up to 4 metrics to overweight
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {highlightedMetrics.map((metric) => {
                      const selected = priorities.includes(metric.label);

                      return (
                        <button
                          key={metric.id}
                          type="button"
                          onClick={() =>
                            toggleSelection(metric.label, priorities, setPriorities, 4)
                          }
                          className={[
                            "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors",
                            selected
                              ? "border-emerald-300 bg-emerald-300 text-black"
                              : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white",
                          ].join(" ")}
                        >
                          {metric.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">Must-haves</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/35">
                    Pick up to 3 requirements the winner must satisfy
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {highlightedMetrics.map((metric) => {
                      const selected = mustHaves.includes(metric.label);

                      return (
                        <button
                          key={`${metric.id}-must`}
                          type="button"
                          onClick={() =>
                            toggleSelection(metric.label, mustHaves, setMustHaves, 3)
                          }
                          className={[
                            "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors",
                            selected
                              ? "border-purple-300 bg-purple-300 text-black"
                              : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white",
                          ].join(" ")}
                        >
                          {metric.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-6 rounded-[28px] border border-white/10 bg-white/[0.02] p-6">
                <div>
                  <p className="text-sm font-semibold text-white">Red flags to avoid</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/35">
                    Comma-separated risks or deal breakers
                  </p>
                  <Textarea
                    value={redFlags}
                    onChange={(event) => setRedFlags(event.target.value)}
                    placeholder="high cost, weak support, poor reliability"
                    className="mt-3 min-h-24 border-white/10 bg-black/30 text-white"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">Analysis depth</p>
                  <div className="mt-3 space-y-3">
                    {analysisDepths.map((depthOption) => {
                      const selected = analysisDepth === depthOption.id;

                      return (
                        <button
                          key={depthOption.id}
                          type="button"
                          onClick={() => setAnalysisDepth(depthOption.id)}
                          className={[
                            "w-full rounded-2xl border p-4 text-left transition-colors",
                            selected
                              ? "border-emerald-400/50 bg-emerald-400/10"
                              : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.04]",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sm font-bold text-white">
                              {depthOption.label}
                            </span>
                            <span
                              className={[
                                "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]",
                                selected
                                  ? "bg-emerald-300 text-black"
                                  : "bg-white/10 text-white/45",
                              ].join(" ")}
                            >
                              {selected ? "Active" : "Idle"}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-white/55">
                            {depthOption.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-black/30 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/35">
                    Current payload
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-white/60">
                    <p>Mode: <span className="font-semibold text-white">{compareMode}</span></p>
                    <p>Depth: <span className="font-semibold text-white">{analysisDepth}</span></p>
                    <p>Priorities: <span className="font-semibold text-white">{priorities.length ? priorities.join(", ") : "none"}</span></p>
                    <p>Must-haves: <span className="font-semibold text-white">{mustHaves.length ? mustHaves.join(", ") : "none"}</span></p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Quick Examples */}
          <div className="text-center">
            <p className="text-xs text-white/30 mb-3">Popular comparisons:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                ["Paris", "London"],
                ["iPhone 16", "Galaxy S25"],
                ["React", "Vue"],
                ["PS5", "Xbox"],
              ].map(([a, b]) => (
                <button
                  key={`${a}-${b}`}
                  onClick={() => {
                    setItemA(a);
                    setItemB(b);
                  }}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-xs text-white/60 transition-all"
                >
                  {a} vs {b}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DuelEngine;
