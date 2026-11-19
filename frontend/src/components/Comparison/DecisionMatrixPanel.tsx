import React, { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sliders, Trophy, Save, Trash2, HelpCircle, Activity, Sparkles, FolderOpen, Lock } from "@/components/icons";
import { motion } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { ComparisonData } from "./types";
import { panelClass } from "./constants";
import { useT } from "@/i18n";

import { ScoreDetailDrawer } from "./ScoreDetailDrawer";

type DecisionMatrixRecord = {
  id: string;
  comparisonId: string | null;
  name: string;
  weights: Record<string, number>;
  result: { scoreA?: number; scoreB?: number } | null;
  createdAt: string;
};

export const DecisionMatrixPanel = ({ 
  result, 
  comparisonId 
}: { 
  result: ComparisonData;
  comparisonId: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { session } = useAuth();
  const t = useT();
  
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Weights state: maps dimension subject -> slider value (1-5)
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [matrixName, setMatrixName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  // Shared cache with the decision receipt: one fetch per comparison, one
  // canonical list for every mounted panel.
  const savedQuery = useQuery({
    queryKey: ["decision-matrices", comparisonId],
    enabled: Boolean(session),
    queryFn: async () => {
      const res = await apiFetch(buildApiUrl(`/api/decision-matrices?comparisonId=${comparisonId}`));
      if (!res.ok) throw new Error(t("dm.err.loadTemplates"));
      const data = (await res.json()) as { matrices: DecisionMatrixRecord[] };
      return data.matrices;
    },
  });
  const savedMatrices = savedQuery.data ?? [];
  const isLoadingSaved = savedQuery.isPending && Boolean(session);

  const profilesQuery = useQuery({
    queryKey: ["decision-matrices", "all"],
    enabled: Boolean(session),
    queryFn: async () => {
      const res = await apiFetch(buildApiUrl("/api/decision-matrices"));
      if (!res.ok) throw new Error(t("dm.err.loadProfiles"));
      const data = (await res.json()) as { matrices: DecisionMatrixRecord[] };
      return data.matrices.filter((matrix) => matrix.comparisonId === null);
    },
  });
  const defaultProfiles = profilesQuery.data ?? [];

  const refreshMatrices = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["decision-matrices"] });
  }, [queryClient]);

  const loadSavedMatrices = useCallback(async () => {
    refreshMatrices();
  }, [refreshMatrices]);

  const loadDefaultProfiles = useCallback(async () => {
    refreshMatrices();
  }, [refreshMatrices]);

  // Initialize weights with 3 (default midpoint) for all subjects
  useEffect(() => {
    if (result.dimensions) {
      const initial: Record<string, number> = {};
      result.dimensions.forEach((d) => {
        initial[d.subject] = 3;
      });
      setWeights(initial);
    }
  }, [result.dimensions]);

  useEffect(() => {
    if (session) {
      void loadSavedMatrices();
      void loadDefaultProfiles();
    }
  }, [loadDefaultProfiles, loadSavedMatrices, session]);

  // Calculate weighted scores in real-time
  const scores = useMemo(() => {
    if (!result.dimensions || result.dimensions.length === 0) {
      return { scoreA: 0, scoreB: 0, winner: "tie" };
    }

    let sumWeights = 0;
    let weightedSumA = 0;
    let weightedSumB = 0;

    result.dimensions.forEach((d) => {
      const w = weights[d.subject] ?? 3;
      sumWeights += w;
      // Normalize raw score relative to full mark, scaled to 100
      const normA = (d.a / d.fullMark) * 100;
      const normB = (d.b / d.fullMark) * 100;
      
      weightedSumA += normA * w;
      weightedSumB += normB * w;
    });

    const finalA = sumWeights > 0 ? Number((weightedSumA / sumWeights).toFixed(1)) : 0;
    const finalB = sumWeights > 0 ? Number((weightedSumB / sumWeights).toFixed(1)) : 0;

    let winner: "a" | "b" | "tie" = "tie";
    if (finalA > finalB) winner = "a";
    else if (finalB > finalA) winner = "b";

    return {
      scoreA: finalA,
      scoreB: finalB,
      winner
    };
  }, [result.dimensions, weights]);

  // Animate the winner trophy when winner changes
  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (scores.winner !== "tie") {
      gsap.fromTo(
        ".winner-trophy",
        { scale: 0.6, rotate: -20, opacity: 0 },
        { scale: 1, rotate: 0, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
      );
    }
  }, { dependencies: [scores.winner], scope: containerRef });

  const handleSliderChange = (subject: string, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [subject]: value
    }));
  };

  // Reset to default weights (3)
  const handleReset = () => {
    const resetWeights: Record<string, number> = {};
    result.dimensions.forEach((d) => {
      resetWeights[d.subject] = 3;
    });
    setWeights(resetWeights);
    toast.success(t("dm.toast.reset"));
  };

  // Save the current weight template
  const handleSaveMatrix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error(t("dm.toast.signInToSave"));
      return;
    }
    if (!matrixName.trim()) {
      toast.error(t("dm.toast.enterName"));
      return;
    }

    try {
      setIsSaving(true);
      const res = await apiFetch(buildApiUrl("/api/decision-matrices"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comparisonId,
          name: matrixName.trim(),
          weights,
          result: {
            scoreA: scores.scoreA,
            scoreB: scores.scoreB,
            winner: scores.winner
          }
        }),
      });

      if (!res.ok) throw new Error(t("dm.err.saveTemplate"));
      toast.success(t("dm.toast.saved"));
      setMatrixName("");
      void loadSavedMatrices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("dm.err.saveTemplateGeneric"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDefaultProfile = async () => {
    if (!session || !matrixName.trim()) {
      toast.error(t("dm.toast.nameProfile"));
      return;
    }
    try {
      setIsSaving(true);
      const res = await apiFetch(buildApiUrl("/api/decision-matrices"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: matrixName.trim(), weights, result: { scoreA: scores.scoreA, scoreB: scores.scoreB, winner: scores.winner } }),
      });
      if (!res.ok) throw new Error(t("dm.err.saveProfile"));
      toast.success(t("dm.toast.profileSaved"));
      setMatrixName("");
      void loadDefaultProfiles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("dm.err.saveProfileGeneric"));
    } finally { setIsSaving(false); }
  };

  // Delete a saved template
  const handleDeleteMatrix = async (id: string) => {
    try {
      const res = await apiFetch(buildApiUrl(`/api/decision-matrices?id=${id}`), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(t("dm.err.deleteTemplate"));
      refreshMatrices();
      toast.success(t("dm.toast.deleted"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("dm.err.deleteTemplateGeneric"));
    }
  };

  // Load a saved template
  const handleLoadMatrix = (matrix: DecisionMatrixRecord) => {
    setWeights(matrix.weights);
    toast.success(t("dm.toast.loaded", { name: matrix.name }));
  };

  return (
    <div id="decision-matrix" ref={containerRef} className={cn(panelClass, "overflow-hidden mb-10 scroll-mt-28")}>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-white/[0.08] bg-white/[0.025] p-5 sm:flex-row sm:items-center md:p-7">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-300/15 bg-orange-400/[0.07] text-orange-300">
            <Sliders className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h3 className="font-serif text-2xl tracking-tight text-[#fffaf1]">{t("dm.title")}</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 mt-1">{t("dm.subtitle")}</p>
          </div>
        </div>
        
        <button 
          onClick={handleReset}
          className="min-h-10 rounded-xl border border-white/10 px-4 text-[10px] font-bold uppercase tracking-wider text-white/55 transition-all hover:bg-white/[0.05] hover:text-white"
        >
          {t("dm.reset")}
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-[#2a2a2a]">
        
        {/* Sliders Configuration */}
        <div className="space-y-5 border-b border-white/[0.08] p-4 sm:p-6 md:p-8 lg:col-span-7 lg:border-b-0 lg:border-r">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#fdfbf7]/60 flex items-center gap-2">
            <Sliders className="h-3.5 w-3.5 text-orange-500" /> {t("dm.configure")}
          </h4>
          
          <div className="space-y-5">
            {result.dimensions.map((dim) => {
              const currentWeight = weights[dim.subject] ?? 3;
              return (
                <div
                  key={dim.subject}
                  className="space-y-3 rounded-xl border border-white/[0.07] bg-black/20 p-4 transition-all hover:border-orange-500/25 hover:bg-orange-500/[0.035]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#fdfbf7]">{dim.subject}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDimension(dim.subject);
                          setIsDrawerOpen(true);
                        }}
                        aria-label={t("dm.viewEvidenceAria", { subject: dim.subject })}
                        className="inline-flex items-center gap-1 rounded border border-[#333] px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/60 transition-colors hover:border-orange-500/35 hover:text-orange-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500"
                      >
                        <HelpCircle className="h-3 w-3" />
                        {t("res.bar.evidence")}
                      </button>
                      <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                        w={currentWeight}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] font-bold text-[#fdfbf7]/30 uppercase tracking-widest shrink-0">{t("dm.weight.low")}</span>
                    <input 
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={currentWeight}
                      onChange={(e) => handleSliderChange(dim.subject, parseInt(e.target.value))}
                      aria-label={t("dm.importanceAria", { subject: dim.subject })}
                      className="w-full h-1 bg-[#1f1f1f] rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <span className="text-[9px] font-bold text-[#fdfbf7]/30 uppercase tracking-widest shrink-0">{t("dm.weight.critical")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Matrix Outputs */}
        <div className="flex flex-col justify-between bg-black/15 p-4 sm:p-6 md:p-8 lg:col-span-5">
          <div className="space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#fdfbf7]/60 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-cyan-400" /> {t("dm.matrixTitle")}
            </h4>

            {/* Score Boards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Entity A */}
              <div className="group relative min-w-0 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.025] p-3.5 text-center sm:p-4">
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: result.entities.a.hex }} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/45 block mb-1 truncate">
                  {result.entities.a.name}
                </span>
                <span className="mt-1.5 block font-serif text-2xl font-semibold tabular-nums leading-none text-[#fdfbf7] sm:text-3xl">
                  {scores.scoreA}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/35 block mt-1.5">{t("dm.weightedIndex")}</span>
              </div>

              {/* Entity B */}
              <div className="group relative min-w-0 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.025] p-3.5 text-center sm:p-4">
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: result.entities.b.hex }} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/45 block mb-1 truncate">
                  {result.entities.b.name}
                </span>
                <span className="mt-1.5 block font-serif text-2xl font-semibold tabular-nums leading-none text-[#fdfbf7] sm:text-3xl">
                  {scores.scoreB}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/35 block mt-1.5">{t("dm.weightedIndex")}</span>
              </div>
            </div>

            {/* Winner Overview Panel */}
            <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-6 relative overflow-hidden">
              <div className="flex items-center gap-4">
                {scores.winner !== "tie" ? (
                  <>
                    <div className="winner-trophy flex h-12 w-12 items-center justify-center rounded-sm bg-orange-500/10 border border-orange-500/20 text-orange-400 shrink-0">
                      <Trophy className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-orange-400 block">{t("dm.verdict")}</span>
                      <h5 className="font-serif text-lg text-[#fdfbf7] mt-0.5">
                        {t("dm.winnerWins", { name: scores.winner === "a" ? result.entities.a.name : result.entities.b.name })}
                      </h5>
                      <p className="text-[10px] text-[#fdfbf7]/50 mt-1">
                        {t("dm.winnerDesc", { name: scores.winner === "a" ? result.entities.a.name : result.entities.b.name })}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#222] border border-[#333] text-[#fdfbf7]/40 shrink-0">
                      <HelpCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 block">{t("dm.verdict")}</span>
                      <h5 className="font-serif text-lg text-[#fdfbf7] mt-0.5">{t("dm.tiedTitle")}</h5>
                      <p className="text-[10px] text-[#fdfbf7]/50 mt-1">
                        {t("dm.tiedDesc")}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Save Form */}
          <form onSubmit={handleSaveMatrix} className="mt-8 border-t border-[#1f1f1f] pt-6 space-y-3">
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 block">{t("dm.saveLabel")}</label>
            <div className="flex flex-col gap-2">
              <input 
                type="text"
                placeholder={t("dm.savePlaceholder")}
                value={matrixName}
                onChange={(e) => setMatrixName(e.target.value)}
                className="h-11 w-full min-w-0 rounded-sm border border-[#333] bg-black px-3 text-base sm:text-xs text-[#fdfbf7] outline-none transition-colors placeholder:text-[#fdfbf7]/30 focus:border-orange-500"
              />
              <div className="flex flex-wrap gap-2">
                <motion.button 
                  whileHover={!isSaving ? { scale: 1.02 } : undefined}
                  whileTap={!isSaving ? { scale: 0.96 } : undefined}
                  type="submit" 
                  disabled={isSaving}
                  className="h-10 px-4 flex-1 flex items-center justify-center gap-1.5 rounded-sm bg-orange-600 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-orange-700 disabled:opacity-50 whitespace-nowrap"
                >
                  <Save className="h-3.5 w-3.5 shrink-0" />
                  {isSaving ? t("dm.saving") : t("dm.save")}
                </motion.button>
                <motion.button 
                  whileHover={!isSaving ? { scale: 1.02 } : undefined}
                  whileTap={!isSaving ? { scale: 0.96 } : undefined}
                  type="button" 
                  onClick={() => void handleSaveDefaultProfile()} 
                  disabled={isSaving} 
                  className="h-10 rounded-sm border border-orange-500/40 px-3 text-[9px] font-bold uppercase tracking-widest text-orange-300 transition-colors hover:bg-orange-500/10 disabled:opacity-50 whitespace-nowrap"
                >
                  {t("dm.default")}
                </motion.button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Saved Matrices List Footer */}
      <div className="p-6 bg-[#090908] border-t border-[#1f1f1f]">
        {session && defaultProfiles.length > 0 && (
          <div className="mb-6">
            <h4 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-orange-300">{t("dm.defaultProfiles")}</h4>
            <div className="flex flex-wrap gap-2">
              {defaultProfiles.map((matrix) => <button key={matrix.id} type="button" onClick={() => handleLoadMatrix(matrix)} className="rounded-sm border border-orange-500/30 bg-orange-500/5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-orange-200 hover:bg-orange-500/15">{t("dm.useProfile", { name: matrix.name })}</button>)}
            </div>
          </div>
        )}
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 flex items-center gap-2 mb-4">
          <FolderOpen className="h-3.5 w-3.5 text-cyan-400" /> {t("dm.savedTemplates")}
        </h4>

        {!session ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-orange-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[#fdfbf7]">{t("dm.signInTitle")}</p>
                <p className="text-[10px] text-[#fdfbf7]/50 mt-0.5">{t("dm.signInDesc")}</p>
              </div>
            </div>
            <a 
              href="/auth/sign-up" 
              className="px-4 py-1.5 bg-[#fdfbf7] hover:bg-[#fdfbf7]/90 text-black font-bold uppercase tracking-widest text-[9px] rounded-sm transition-colors shrink-0"
            >
              {t("dm.signUpFree")}
            </a>
          </div>
        ) : isLoadingSaved ? (
          <p className="text-xs text-[#fdfbf7]/30">{t("dm.loadingSaved")}</p>
        ) : savedMatrices.length === 0 ? (
          <p className="text-xs text-[#fdfbf7]/30 italic">{t("dm.noSaved")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {savedMatrices.map((matrix) => (
              <div 
                key={matrix.id} 
                className="group flex items-center justify-between rounded-sm border border-[#1f1f1f] bg-[#0c0b0a] p-3 hover:border-orange-500/30 transition-colors"
              >
                <button
                  onClick={() => handleLoadMatrix(matrix)}
                  className="flex-1 text-left min-w-0"
                >
                  <span className="text-xs font-semibold text-[#fdfbf7] block truncate group-hover:text-orange-400 transition-colors">
                    {matrix.name}
                  </span>
                  <span className="text-[9px] text-[#fdfbf7]/40 uppercase tracking-widest block mt-0.5">
                    {t("dm.savedScores", { a: matrix.result?.scoreA ?? 0, b: matrix.result?.scoreB ?? 0 })}
                  </span>
                </button>
                <button
                  onClick={() => handleDeleteMatrix(matrix.id)}
                  className="p-1.5 text-[#fdfbf7]/30 hover:text-red-400 rounded hover:bg-red-500/10 transition-colors shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ScoreDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        dimensionSubject={selectedDimension}
        result={result}
      />
    </div>
  );
};
