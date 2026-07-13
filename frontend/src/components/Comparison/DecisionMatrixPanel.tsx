import React, { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { Sliders, Trophy, Save, Trash2, HelpCircle, Activity, Sparkles, FolderOpen, Lock } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { ComparisonData } from "./types";
import { panelClass } from "./constants";

import { ScoreDetailDrawer } from "./ScoreDetailDrawer";

type DecisionMatrixRecord = {
  id: string;
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
  
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Weights state: maps dimension subject -> slider value (1-5)
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [savedMatrices, setSavedMatrices] = useState<DecisionMatrixRecord[]>([]);
  const [matrixName, setMatrixName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

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

  // Load saved matrices for this comparison
  const loadSavedMatrices = useCallback(async () => {
    if (!session) return;
    try {
      setIsLoadingSaved(true);
      const res = await apiFetch(buildApiUrl(`/api/decision-matrices?comparisonId=${comparisonId}`));
      if (!res.ok) throw new Error("Could not load decision templates.");
      const data = (await res.json()) as { matrices: DecisionMatrixRecord[] };
      setSavedMatrices(data.matrices);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSaved(false);
    }
  }, [comparisonId, session]);

  useEffect(() => {
    if (session) {
      void loadSavedMatrices();
    }
  }, [loadSavedMatrices, session]);

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
    toast.success("Weights reset to default.");
  };

  // Save the current weight template
  const handleSaveMatrix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("Please sign in or create an account to save weight templates.");
      return;
    }
    if (!matrixName.trim()) {
      toast.error("Please enter a template name.");
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

      if (!res.ok) throw new Error("Failed to save template.");
      toast.success("Weights template saved successfully.");
      setMatrixName("");
      void loadSavedMatrices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error saving template.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete a saved template
  const handleDeleteMatrix = async (id: string) => {
    try {
      const res = await apiFetch(buildApiUrl(`/api/decision-matrices?id=${id}`), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete template.");
      setSavedMatrices((prev) => prev.filter((m) => m.id !== id));
      toast.success("Template deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error deleting template.");
    }
  };

  // Load a saved template
  const handleLoadMatrix = (matrix: DecisionMatrixRecord) => {
    setWeights(matrix.weights);
    toast.success(`Loaded weight template: "${matrix.name}"`);
  };

  return (
    <div id="decision-matrix" ref={containerRef} className={cn(panelClass, "overflow-hidden mb-10 scroll-mt-28")}>
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-[#2a2a2a] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111]">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#1a1a1a] border border-[#333] text-[#fdfbf7]/50">
            <Sliders className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h3 className="font-serif text-2xl text-[#fdfbf7] tracking-tight">Interactive Decision Matrix</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 mt-1">Weighted Decision Intelligence</p>
          </div>
        </div>
        
        <button 
          onClick={handleReset}
          className="rounded-sm border border-[#333] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60 hover:bg-[#1a1a1a] hover:text-[#fdfbf7] transition-all"
        >
          Reset to default
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-[#2a2a2a]">
        
        {/* Sliders Configuration */}
        <div className="lg:col-span-7 p-6 md:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-[#2a2a2a]">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#fdfbf7]/60 flex items-center gap-2">
            <Sliders className="h-3.5 w-3.5 text-orange-500" /> Configure Dimension Importance
          </h4>
          
          <div className="space-y-5">
            {result.dimensions.map((dim) => {
              const currentWeight = weights[dim.subject] ?? 3;
              return (
                <div
                  key={dim.subject}
                  className="rounded-sm border border-[#1f1f1f] bg-[#0c0b0a] p-4 space-y-2 hover:border-orange-500/35 hover:bg-[#1a110a] transition-all"
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
                        aria-label={`View evidence for ${dim.subject}`}
                        className="inline-flex items-center gap-1 rounded border border-[#333] px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/60 transition-colors hover:border-orange-500/35 hover:text-orange-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500"
                      >
                        <HelpCircle className="h-3 w-3" />
                        Evidence
                      </button>
                      <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                        w={currentWeight}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] font-bold text-[#fdfbf7]/30 uppercase tracking-widest shrink-0">Low</span>
                    <input 
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={currentWeight}
                      onChange={(e) => handleSliderChange(dim.subject, parseInt(e.target.value))}
                      aria-label={`Importance of ${dim.subject}`}
                      className="w-full h-1 bg-[#1f1f1f] rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <span className="text-[9px] font-bold text-[#fdfbf7]/30 uppercase tracking-widest shrink-0">Critical</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Matrix Outputs */}
        <div className="lg:col-span-5 p-6 md:p-8 bg-[#0c0b0a] flex flex-col justify-between">
          <div className="space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#fdfbf7]/60 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-cyan-400" /> Real-time Decision Matrix
            </h4>

            {/* Score Boards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Entity A */}
              <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-5 text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: result.entities.a.hex }} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 block mb-1">
                  {result.entities.a.name}
                </span>
                <span className="text-4xl font-serif font-semibold text-[#fdfbf7] block mt-2">
                  {scores.scoreA}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/30 block mt-1">Weighted Index</span>
              </div>

              {/* Entity B */}
              <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-5 text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: result.entities.b.hex }} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 block mb-1">
                  {result.entities.b.name}
                </span>
                <span className="text-4xl font-serif font-semibold text-[#fdfbf7] block mt-2">
                  {scores.scoreB}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/30 block mt-1">Weighted Index</span>
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
                      <span className="text-[9px] font-bold uppercase tracking-widest text-orange-400 block">Decision Verdict</span>
                      <h5 className="font-serif text-lg text-[#fdfbf7] mt-0.5">
                        {scores.winner === "a" ? result.entities.a.name : result.entities.b.name} Wins
                      </h5>
                      <p className="text-[10px] text-[#fdfbf7]/50 mt-1">
                        Based on importance weights, {scores.winner === "a" ? result.entities.a.name : result.entities.b.name} is the optimal choice for your requirements.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#222] border border-[#333] text-[#fdfbf7]/40 shrink-0">
                      <HelpCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 block">Decision Verdict</span>
                      <h5 className="font-serif text-lg text-[#fdfbf7] mt-0.5">Tied Recommendation</h5>
                      <p className="text-[10px] text-[#fdfbf7]/50 mt-1">
                        Adjust criteria sliders to emphasize specific dimension priorities and break the tie.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Save Form */}
          <form onSubmit={handleSaveMatrix} className="mt-8 border-t border-[#1f1f1f] pt-6 space-y-3">
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 block">Save Current Weights Template</label>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="e.g. Developer Heavy"
                value={matrixName}
                onChange={(e) => setMatrixName(e.target.value)}
                className="h-9 flex-1 rounded-sm border border-[#333] bg-black px-3 text-xs text-[#fdfbf7] outline-none transition-colors placeholder:text-[#fdfbf7]/30 focus:border-orange-500"
              />
              <button 
                type="submit" 
                disabled={isSaving}
                className="h-9 px-4 flex items-center gap-1.5 rounded-sm bg-orange-600 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-orange-700 disabled:opacity-50 shrink-0"
              >
                <Save className="h-3.5 w-3.5" />
                {isSaving ? "Saving" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Saved Matrices List Footer */}
      <div className="p-6 bg-[#090908] border-t border-[#1f1f1f]">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 flex items-center gap-2 mb-4">
          <FolderOpen className="h-3.5 w-3.5 text-cyan-400" /> Saved Matrices Templates
        </h4>

        {!session ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-orange-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[#fdfbf7]">Sign in to save templates</p>
                <p className="text-[10px] text-[#fdfbf7]/50 mt-0.5">Create custom weight matrices, save configurations, and monitor comparison variations.</p>
              </div>
            </div>
            <a 
              href="/auth/sign-up" 
              className="px-4 py-1.5 bg-[#fdfbf7] hover:bg-[#fdfbf7]/90 text-black font-bold uppercase tracking-widest text-[9px] rounded-sm transition-colors shrink-0"
            >
              Sign Up Free
            </a>
          </div>
        ) : isLoadingSaved ? (
          <p className="text-xs text-[#fdfbf7]/30">Loading saved weight templates...</p>
        ) : savedMatrices.length === 0 ? (
          <p className="text-xs text-[#fdfbf7]/30 italic">No saved weight templates templates for this comparison yet.</p>
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
                    Scores: {matrix.result?.scoreA ?? 0} vs {matrix.result?.scoreB ?? 0}
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

      {/* Clickable Brand Footer Link */}
      <div className="mt-8 pt-4 border-t border-[#2a2a2a] text-center text-xs text-[#fdfbf7]/20 pb-4">
        <a href="https://snapsolve.ink" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">
          Made by SnapSolve Ink
        </a>
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
