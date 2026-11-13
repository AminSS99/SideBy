import React, { useState, useMemo, useEffect, useRef } from "react";
import { Trophy } from "@/components/icons";
import { SafePanel } from "@/components/SafePanel";
import {
  planAdaptivePresentation,
  validatePresentationSpec,
  validateModuleDataReferences,
  getScopedCategories,
  getScopedDimensions,
  getScopedSources,
  type AdaptivePresentationSpec,
  type PresentationModuleConfig,
  type VisualModuleType,
} from "@/lib/adaptive-canvas/presentation-spec";
import type {
  ComparisonData,
  ComparisonFact,
} from "@/components/Comparison/types";
import { CanvasHeroHeader } from "./CanvasHeroHeader";
import { InteractiveTradeoffCanvas } from "./InteractiveTradeoffCanvas";
import { OutcomeSimulatorPanel } from "./OutcomeSimulatorPanel";
import { ArchetypeSpecMatrix } from "./ArchetypeSpecMatrix";
import { CategoryDeepDivePanel } from "./CategoryDeepDivePanel";
import { EvidenceFocusModal, type FocusedEvidenceItem } from "./EvidenceFocusModal";
import {
  RadarChartPanel,
  VerdictPanel,
  DecisionReceiptPanel,
  EvidenceGapPanel,
  SourcesPanel,
} from "@/components/Comparison/ComparisonEngine";

type ComparisonVersion = {
  id: string;
  versionNumber: number;
  changeSummary: {
    diff?: {
      scores?: unknown[];
      facts?: { added?: unknown[]; removed?: unknown[] };
    };
    alert?: { message?: string } | null;
  };
  createdAt: string;
};

interface AdaptiveDecisionCanvasProps {
  comparison: ComparisonData;
  comparisonId: string;
  isPublic?: boolean;
  publishEligibility?: { eligible: boolean; classification?: string; reasons: string[] };
  onRefresh: () => void;
  onToggleClassicMode: () => void;
  onNavigateToFollowUp?: () => void;
  // Preserving complete comparison journey
  version?: ComparisonVersion | null;
  versionNumber?: number;
  isHistorical?: boolean;
  // Shared weights for state preservation across presentation toggling
  weights?: Record<string, number>;
  onWeightChange?: (subject: string, weight: number) => void;
  onResetWeights?: () => void;
}

const VIEW_MODULES_MAP: Record<"overview" | "tradeoffs" | "flips" | "evidence", VisualModuleType[]> = {
  overview: [
    "hero-header",
    "recommendation-summary",
    "tradeoff-tuning",
    "radar-overview",
    "spec-matrix",
    "category-deepdive",
    "decision-receipt",
  ],
  tradeoffs: [
    "hero-header",
    "tradeoff-tuning",
    "outcome-simulator",
  ],
  flips: [
    "hero-header",
    "outcome-simulator",
    "evidence-audit",
  ],
  evidence: [
    "hero-header",
    "spec-matrix",
    "category-deepdive",
    "sources-view",
    "evidence-audit",
  ],
};

export const AdaptiveDecisionCanvas: React.FC<AdaptiveDecisionCanvasProps> = ({
  comparison,
  comparisonId,
  isPublic,
  publishEligibility,
  onRefresh,
  onToggleClassicMode,
  onNavigateToFollowUp,
  version,
  versionNumber,
  isHistorical,
  weights: propsWeights,
  onWeightChange: propsOnWeightChange,
  onResetWeights: propsOnResetWeights,
}) => {
  const recordKey = `${comparisonId}:${versionNumber ?? "live"}`;
  const prevRecordKeyRef = useRef(recordKey);

  // 1. Generate & strictly validate presentation specification
  // Rejected specifications must NEVER be rendered — fall back immediately to Classic Workbench.
  const spec: AdaptivePresentationSpec | null = useMemo(() => {
    const raw = planAdaptivePresentation(comparison);
    const validated = validatePresentationSpec(raw);
    return validated; // If null, return null (never validated || raw)
  }, [comparison]);

  // Fallback trigger if spec fails validation
  useEffect(() => {
    if (!spec) {
      onToggleClassicMode();
    }
  }, [spec, onToggleClassicMode]);

  // 2. Weights State (internal fallback if not hoisted)
  const [localWeights, setLocalWeights] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const d of comparison.dimensions) initial[d.subject] = 3;
    return initial;
  });

  const effectiveWeights = propsWeights || localWeights;

  const handleWeightChange = (subject: string, weight: number) => {
    if (propsOnWeightChange) {
      propsOnWeightChange(subject, weight);
    } else {
      setLocalWeights((prev) => ({ ...prev, [subject]: weight }));
    }
  };

  const handleResetWeights = () => {
    if (propsOnResetWeights) {
      propsOnResetWeights();
    } else {
      const reset: Record<string, number> = {};
      for (const d of comparison.dimensions) reset[d.subject] = 3;
      setLocalWeights(reset);
    }
  };

  // 3. Navigation View State
  const [activeView, setActiveView] = useState<"overview" | "tradeoffs" | "flips" | "evidence">("overview");

  // 4. Evidence focus modal state
  const [focusedEvidence, setFocusedEvidence] = useState<FocusedEvidenceItem | null>(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);

  // Reset view & modal when comparison or version changes
  useEffect(() => {
    if (prevRecordKeyRef.current !== recordKey) {
      prevRecordKeyRef.current = recordKey;
      setActiveView("overview");
      setFocusedEvidence(null);
      setIsEvidenceModalOpen(false);
      if (!propsWeights) {
        const reset: Record<string, number> = {};
        for (const d of comparison.dimensions) reset[d.subject] = 3;
        setLocalWeights(reset);
      }
    }
  }, [recordKey, comparison.dimensions, propsWeights]);

  const handleSelectFact = (fact: ComparisonFact, categoryName: string) => {
    setFocusedEvidence({
      kind: "fact",
      fact,
      categoryName,
    });
    setIsEvidenceModalOpen(true);
  };

  const handleFocusEvidenceDimension = (subject: string) => {
    const matchedCategory = comparison.categories.find(
      (c) =>
        c.name.toLowerCase().includes(subject.toLowerCase()) ||
        subject.toLowerCase().includes(c.name.toLowerCase()),
    );
    const matchedFact = matchedCategory?.facts[0];
    if (matchedFact) {
      handleSelectFact(matchedFact, matchedCategory.name);
    } else {
      setActiveView("evidence");
    }
  };

  // Filter and sort modules strictly honoring spec.modules ordering and validated data references
  const modulesToRender = useMemo(() => {
    if (!spec) return [];
    const allowedTypes = VIEW_MODULES_MAP[activeView];
    return [...spec.modules]
      .filter((mod) => allowedTypes.includes(mod.type))
      .filter((mod) => validateModuleDataReferences(mod, comparison))
      .sort((a, b) => a.priority - b.priority);
  }, [spec, activeView, comparison]);

  if (!spec) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center text-xs text-white/50">
        Presentation specification could not be verified. Falling back to Classic Workbench...
      </div>
    );
  }

  // Registry Renderer
  const renderRegistryModule = (mod: PresentationModuleConfig) => {
    switch (mod.type) {
      case "hero-header":
        return (
          <SafePanel key={mod.id} panelName={mod.title || "Header"} resetKey={recordKey}>
            <CanvasHeroHeader
              comparison={comparison}
              spec={spec}
              activeView={activeView}
              onSelectView={setActiveView}
              onToggleClassicMode={onToggleClassicMode}
            />
          </SafePanel>
        );

      case "recommendation-summary":
        return (
          <SafePanel key={mod.id} panelName={mod.title || "AI Recommendation"} resetKey={recordKey}>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-400">
                <Trophy className="h-4 w-4" />
                <span>AI Recommendation & Research Verdict</span>
              </div>
              <VerdictPanel result={comparison} />
            </div>
          </SafePanel>
        );

      case "tradeoff-tuning": {
        const scopedDimensions = getScopedDimensions(mod, comparison);
        return (
          <SafePanel key={mod.id} panelName={mod.title || "Trade-off Tuning"} resetKey={recordKey}>
            <InteractiveTradeoffCanvas
              dimensions={scopedDimensions}
              weights={effectiveWeights}
              onWeightChange={handleWeightChange}
              onResetWeights={handleResetWeights}
              entities={comparison.entities}
              onFocusEvidence={handleFocusEvidenceDimension}
            />
          </SafePanel>
        );
      }

      case "outcome-simulator": {
        const scopedDimensions = getScopedDimensions(mod, comparison);
        return (
          <SafePanel key={mod.id} panelName={mod.title || "Outcome Simulator"} resetKey={recordKey}>
            <OutcomeSimulatorPanel
              dimensions={scopedDimensions}
              weights={effectiveWeights}
              entities={comparison.entities}
              onApplyWeight={handleWeightChange}
              onNavigateToFollowUp={onNavigateToFollowUp}
            />
          </SafePanel>
        );
      }

      case "spec-matrix": {
        const scopedCategories = getScopedCategories(mod, comparison);
        const scopedComparison = {
          ...comparison,
          categories: scopedCategories,
        };
        return (
          <SafePanel key={mod.id} panelName={mod.title || "Specification Matrix"} resetKey={recordKey}>
            <ArchetypeSpecMatrix
              comparison={scopedComparison}
              archetype={spec.archetype}
              onSelectFact={handleSelectFact}
            />
          </SafePanel>
        );
      }

      case "category-deepdive": {
        const scopedCategories = getScopedCategories(mod, comparison);
        return (
          <SafePanel key={mod.id} panelName={mod.title || "Category Deep Dive"} resetKey={recordKey}>
            <CategoryDeepDivePanel
              categories={scopedCategories}
              entities={comparison.entities}
              onSelectFact={handleSelectFact}
              title={mod.title}
              description={mod.description}
              defaultExpanded={mod.defaultExpanded}
            />
          </SafePanel>
        );
      }

      case "radar-overview": {
        const scopedDimensions = getScopedDimensions(mod, comparison);
        const scopedComparison = {
          ...comparison,
          dimensions: scopedDimensions,
        };
        return (
          <SafePanel key={mod.id} panelName={mod.title || "Radar Map"} resetKey={recordKey}>
            <RadarChartPanel result={scopedComparison} />
          </SafePanel>
        );
      }

      case "evidence-audit":
        return (
          <SafePanel key={mod.id} panelName={mod.title || "Evidence Audit"} resetKey={recordKey}>
            <EvidenceGapPanel
              result={comparison}
              comparisonId={comparisonId}
            />
          </SafePanel>
        );

      case "sources-view": {
        const scopedSources = getScopedSources(mod, comparison);
        return (
          <SafePanel key={mod.id} panelName={mod.title || "Sources"} resetKey={recordKey}>
            <SourcesPanel sources={scopedSources} />
          </SafePanel>
        );
      }

      case "decision-receipt":
        return (
          <SafePanel key={mod.id} panelName={mod.title || "Decision Record"} resetKey={recordKey}>
            <DecisionReceiptPanel
              result={comparison}
              comparisonId={comparisonId}
              version={version ?? null}
              versionNumber={versionNumber}
              isHistorical={Boolean(isHistorical)}
            />
          </SafePanel>
        );

      default:
        return null;
    }
  };

  const heroModule = modulesToRender.find((m) => m.type === "hero-header");
  const bodyModules = modulesToRender.filter((m) => m.type !== "hero-header");

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header with View Tabs */}
      {heroModule ? (
        renderRegistryModule(heroModule)
      ) : (
        <SafePanel panelName="Header" resetKey={recordKey}>
          <CanvasHeroHeader
            comparison={comparison}
            spec={spec}
            activeView={activeView}
            onSelectView={setActiveView}
            onToggleClassicMode={onToggleClassicMode}
          />
        </SafePanel>
      )}

      {/* 2. Active Associated ARIA Tabpanel */}
      <div
        id={`adaptive-panel-${activeView}`}
        role="tabpanel"
        aria-labelledby={`adaptive-tab-${activeView}`}
        tabIndex={0}
        className="space-y-8 focus-visible:outline-none"
      >
        {bodyModules.map((mod) => renderRegistryModule(mod))}
      </div>

      {/* Accessible Evidence Focus Modal with real source lineage */}
      <EvidenceFocusModal
        item={focusedEvidence}
        entities={comparison.entities}
        sources={comparison.sources}
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
      />
    </div>
  );
};
