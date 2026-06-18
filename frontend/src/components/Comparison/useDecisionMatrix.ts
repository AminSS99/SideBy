import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { useAuth } from "@/contexts/AuthContext";
import type { ComparisonData } from "./types";

export type DecisionMatrixRecord = {
  id: string;
  name: string;
  weights: Record<string, number>;
  result: { scoreA?: number; scoreB?: number } | null;
  createdAt: string;
};

export const useDecisionMatrix = (result: ComparisonData, comparisonId: string) => {
  const { session } = useAuth();

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
  const loadSavedMatrices = async () => {
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
  };

  useEffect(() => {
    if (session) {
      void loadSavedMatrices();
    }
  }, [comparisonId, session]);

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

  return {
    session,
    weights,
    savedMatrices,
    matrixName,
    setMatrixName,
    isSaving,
    isLoadingSaved,
    scores,
    handleSliderChange,
    handleReset,
    handleSaveMatrix,
    handleDeleteMatrix,
    handleLoadMatrix
  };
};
