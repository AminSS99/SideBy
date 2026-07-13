import React, { useMemo } from "react";
import { Trophy, Globe, Sparkles, Scale, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ComparisonData, ComparisonFact } from "./types";
import { cn } from "@/lib/utils";

interface ScoreDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dimensionSubject: string | null;
  result: ComparisonData | null;
}

export function ScoreDetailDrawer({
  isOpen,
  onClose,
  dimensionSubject,
  result,
}: ScoreDetailDrawerProps) {
  const isMobile = useIsMobile();

  const details = useMemo(() => {
    if (!result || !dimensionSubject) return null;

    // Find matching category in result categories
    const category = result.categories.find(
      (c) => c.name.toLowerCase() === dimensionSubject.toLowerCase()
    );

    if (!category) return null;

    const factsA = category.facts.filter((f) => f.entity === "a");
    const factsB = category.facts.filter((f) => f.entity === "b");

    // Filter contradictions mentioning this category
    const categoryContradictions = result.contradictions?.filter((c) =>
      c.toLowerCase().includes(category.name.toLowerCase())
    ) || [];

    // Find the dimension scores if available
    const dimensionScoreObj = result.dimensions?.find(
      (d) => d.subject.toLowerCase() === dimensionSubject.toLowerCase()
    );

    return {
      category,
      factsA,
      factsB,
      contradictions: categoryContradictions,
      scoreA: dimensionScoreObj?.a ?? null,
      scoreB: dimensionScoreObj?.b ?? null,
      maxScore: dimensionScoreObj?.fullMark ?? 10,
    };
  }, [result, dimensionSubject]);

  if (!result || !dimensionSubject || !details) return null;

  const { category, factsA, factsB, contradictions, scoreA, scoreB, maxScore } = details;

  const winnerEntity =
    category.winner === "a"
      ? result.entities.a
      : category.winner === "b"
        ? result.entities.b
        : null;

  // Facts rendering block
  const renderFactsSection = (facts: ComparisonFact[], entityName: string, hexColor: string) => {
    if (facts.length === 0) {
      return (
        <div className="text-sm text-[#fdfbf7]/30 italic p-4 rounded-sm border border-[#2a2a2a] bg-black/20">
          No concrete facts extracted for {entityName}.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {facts.map((fact, idx) => (
          <div
            key={idx}
            className="p-4 rounded-sm border border-[#1f1f1f] bg-black/40 relative overflow-hidden group hover:border-[#333] transition-colors"
          >
            {/* Side Accent Color */}
            <div className="absolute top-0 bottom-0 left-0 w-0.5" style={{ backgroundColor: hexColor }} />

            <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-2.5 mb-2.5">
              <span className="text-xs font-semibold text-[#fdfbf7]">{fact.label}</span>
              <div className="flex items-center gap-1.5 shrink-0 select-none">
                <span className="text-[9px] font-bold text-[#fdfbf7]/40 uppercase tracking-widest">
                  {Math.round(fact.confidence * 100)}% Conf
                </span>
                <span className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  fact.freshness === "Fresh"
                    ? "bg-emerald-500"
                    : fact.freshness === "Monitor"
                      ? "bg-amber-500"
                      : "bg-[#555]"
                )} />
              </div>
            </div>

            <p className="text-xs leading-relaxed text-[#fdfbf7]/75 font-sans mb-3.5 pr-2">
              {fact.value}
            </p>

            <div className="flex flex-wrap gap-2">
              {fact.sourceUrl ? (
                <a
                  href={fact.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 border border-[#2a2a2a] bg-black px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest text-[#fdfbf7]/50 hover:text-orange-400 hover:border-orange-500/20 transition-all"
                  title={fact.sourceTitle || fact.source}
                >
                  <Globe className="h-2.5 w-2.5" />
                  {fact.source}
                </a>
              ) : (
                <span className="inline-flex items-center gap-1 border border-[#2a2a2a] bg-black px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
                  <Globe className="h-2.5 w-2.5" />
                  {fact.source}
                </span>
              )}
              <Badge className="bg-[#111] hover:bg-[#111] border border-white/5 text-[#fdfbf7]/40 rounded-sm text-[8px] uppercase tracking-widest px-1.5 py-0">
                {fact.freshness}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const content = (
    <div className="space-y-6 overflow-y-auto max-h-[80vh] px-6 pb-6 text-left no-scrollbar">
      {/* Overview Block */}
      <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-5 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-orange-500 block mb-1">
            Category Verdict
          </span>
          <p className="font-serif text-base text-[#fdfbf7]/90 italic leading-relaxed">
            "{category.verdict}"
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          {category.winner !== "tie" && winnerEntity ? (
            <div className="flex items-center gap-2 rounded-sm border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-orange-400">
              <Trophy className="h-3.5 w-3.5" />
              {winnerEntity.name} Wins
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-sm border border-[#333] bg-[#222] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#fdfbf7]/60">
              <Scale className="h-3.5 w-3.5" />
              Tied
            </div>
          )}
        </div>
      </div>

      {/* Real-time Scores Overlay */}
      {(scoreA !== null || scoreB !== null) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-sm border border-[#1f1f1f] bg-black/30 p-4 text-center">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 block mb-1.5">
              {result.entities.a.name} Score
            </span>
            <span className="text-3xl font-serif font-black text-[#fdfbf7]">
              {scoreA !== null ? `${scoreA}/${maxScore}` : "N/A"}
            </span>
          </div>
          <div className="rounded-sm border border-[#1f1f1f] bg-black/30 p-4 text-center">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 block mb-1.5">
              {result.entities.b.name} Score
            </span>
            <span className="text-3xl font-serif font-black text-[#fdfbf7]">
              {scoreB !== null ? `${scoreB}/${maxScore}` : "N/A"}
            </span>
          </div>
        </div>
      )}

      {/* Contradictions Alert */}
      {contradictions.length > 0 && (
        <div className="rounded-sm border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3 items-start">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500 block mb-1">
              Contradictions Identified
            </span>
            <ul className="space-y-1.5">
              {contradictions.map((c, idx) => (
                <li key={idx} className="text-xs text-amber-100/75 leading-relaxed font-sans">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Facts Side-by-Side Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Entity A */}
        <div className="space-y-3">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.15em] block border-b border-white/5 pb-2"
            style={{ color: result.entities.a.hex }}
          >
            {result.entities.a.name} Evidence
          </span>
          {renderFactsSection(factsA, result.entities.a.name, result.entities.a.hex)}
        </div>

        {/* Entity B */}
        <div className="space-y-3">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.15em] block border-b border-white/5 pb-2"
            style={{ color: result.entities.b.hex }}
          >
            {result.entities.b.name} Evidence
          </span>
          {renderFactsSection(factsB, result.entities.b.name, result.entities.b.hex)}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="bg-[#0c0b0a] border-[#2a2a2a] text-white">
          <DrawerHeader className="text-left px-6">
            <DrawerTitle className="font-serif text-2xl tracking-tight text-[#fdfbf7]">
              {category.name}
            </DrawerTitle>
            <DrawerDescription className="text-xs text-[#fdfbf7]/40 uppercase tracking-widest mt-1">
              Source-Backed Decision Evidence
            </DrawerDescription>
          </DrawerHeader>

          {content}

          <DrawerFooter className="border-t border-[#1f1f1f] p-4 bg-black/20">
            <button
              onClick={onClose}
              className="w-full h-11 bg-[#222] hover:bg-[#333] border border-[#444] rounded-sm text-xs font-bold uppercase tracking-widest text-[#fdfbf7]/80 hover:text-white transition-colors"
            >
              Close
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl bg-[#0c0b0a] border-[#2a2a2a] text-white rounded-xl shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-[#2a2a2a] text-left">
          <DialogTitle className="font-serif text-3xl tracking-tight text-[#fdfbf7]">
            {category.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#fdfbf7]/40 uppercase tracking-widest mt-1">
            Source-Backed Decision Evidence
          </DialogDescription>
        </DialogHeader>

        {content}
      </DialogContent>
    </Dialog>
  );
}
