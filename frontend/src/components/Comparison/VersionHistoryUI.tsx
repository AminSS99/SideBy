import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  AlertTriangle,
  GitCompare,
  X,
  Plus,
  Minus,
  TrendingUp,
} from "@/components/icons";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { toast } from "sonner";
import type { ComparisonData } from "./types";
import { formatDate, useI18n } from "@/i18n";

interface VersionHistoryUIProps {
  comparisonId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (result: ComparisonData | null, versionNumber?: number) => void;
  activeVersionNumber?: number;
}

interface ScoreDiff {
  dimension: string;
  oldA: number;
  newA: number;
  deltaA: number;
  oldB: number;
  newB: number;
  deltaB: number;
}

interface FactDiffItem {
  entity: string;
  dimension: string;
  value: string;
  source: string;
  sourceUrl: string;
}

interface DiffOutput {
  diff?: {
    scores?: ScoreDiff[];
    facts?: {
      added?: FactDiffItem[];
      removed?: FactDiffItem[];
    };
  };
  thresholdBreached?: boolean;
}

export const VersionHistoryUI: React.FC<VersionHistoryUIProps> = ({
  comparisonId,
  isOpen,
  onClose,
  onSelectResult,
  activeVersionNumber,
}) => {
  const { t, lang, locale } = useI18n();
  const [baseVersion, setBaseVersion] = useState<number | null>(null);
  const [targetVersion, setTargetVersion] = useState<number | null>(null);
  const [isDiffMode, setIsDiffMode] = useState(false);

  // Fetch all historical versions
  const versionsQuery = useQuery({
    queryKey: ["comparison-versions", comparisonId],
    queryFn: async () => {
      const res = await apiFetch(buildApiUrl(`/api/comparisons/${comparisonId}/versions`));
      if (!res.ok) throw new Error(t("dw.ver.err.load"));
      const data = await res.json();
      return data.versions as Array<{
        id: string;
        versionNumber: number;
        result: ComparisonData;
        sourceCount: number;
        overallConfidence: number | null;
        changeSummary: {
          reason?: string;
          alert?: { threshold: number; message: string } | null;
          diff?: unknown;
        };
        createdAt: string;
      }>;
    },
    enabled: isOpen && Boolean(comparisonId),
  });

  // Fetch diff delta
  const diffQuery = useQuery({
    queryKey: ["comparison-diff", comparisonId, baseVersion, targetVersion],
    queryFn: async () => {
      if (baseVersion === null || targetVersion === null) return null;
      const res = await apiFetch(
        buildApiUrl(
          `/api/comparisons/${comparisonId}/diff?fromVersion=${baseVersion}&toVersion=${targetVersion}`,
        ),
      );
      if (!res.ok) throw new Error(t("dw.ver.err.diff"));
      return (await res.json()) as DiffOutput;
    },
    enabled: isDiffMode && baseVersion !== null && targetVersion !== null,
  });

  if (!isOpen) return null;

  const versions = versionsQuery.data || [];

  const handleSelectSnapshot = (ver: typeof versions[0]) => {
    if (activeVersionNumber === ver.versionNumber) {
      // Toggle back to latest state
      onSelectResult(null, undefined);
      toast.info(t("dw.ver.toast.live"));
    } else {
      onSelectResult(ver.result, ver.versionNumber);
      toast.success(t("dw.ver.toast.snapshot", { version: ver.versionNumber }));
    }
  };

  const handleCompareClick = () => {
    if (versions.length < 2) {
      toast.error(t("dw.ver.toast.needTwo"));
      return;
    }
    setIsDiffMode(true);
    setBaseVersion(versions[0].versionNumber);
    setTargetVersion(versions[versions.length - 1].versionNumber);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative z-50 w-full max-w-xl border-l border-white/10 bg-[#0c0c0c] p-6 shadow-2xl flex flex-col h-full overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/15 pb-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500/80" />
              {t("dw.ver.title")}
            </h2>
            <p className="text-xs text-white/45 mt-1">
              {t("dw.ver.subtitle")}
            </p>
          </div>
          <button
            type="button"
            aria-label={t("dw.ver.closeAria")}
            onClick={onClose}
            className="rounded-full border border-white/10 p-2 text-white/50 hover:bg-white/5 hover:text-white transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 py-6">
          {versionsQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/45">
              <svg className="animate-spin h-6 w-6 text-orange-500 mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-xs">{t("dw.ver.scanning")}</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <Clock className="mx-auto h-8 w-8 mb-3 opacity-30" />
              <p className="text-sm">{t("dw.ver.emptyTitle")}</p>
              <p className="text-xs mt-1">{t("dw.ver.emptyDesc")}</p>
            </div>
          ) : !isDiffMode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-white/45">
                  {t("dw.ver.timeline", { count: versions.length })}
                </span>
                {versions.length >= 2 && (
                  <button
                    type="button"
                    onClick={handleCompareClick}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/25 bg-orange-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-400 hover:bg-orange-500/20 transition-all"
                  >
                    <GitCompare className="h-3.5 w-3.5" />
                    {t("dw.ver.diffSnapshots")}
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {versions.map((ver) => {
                  const isCurrent = activeVersionNumber === ver.versionNumber;
                  const hasAlert = ver.changeSummary?.alert;

                  return (
                    <div
                      key={ver.id}
                      className={`relative rounded-2xl border p-4 transition-all duration-200 cursor-pointer ${
                        isCurrent
                          ? "border-orange-500 bg-orange-500/5 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                      }`}
                      onClick={() => handleSelectSnapshot(ver)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                              V{ver.versionNumber}
                            </span>
                            {hasAlert && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                                <AlertTriangle className="h-3 w-3" />
                                {t("dw.ver.driftAlert")}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm font-medium text-white/80">
                            {ver.result?.query || t("dw.ver.entityComparison")}
                          </p>
                        </div>
                        <span className="text-[10px] text-white/40 font-mono">
                          {new Intl.DateTimeFormat(locale, {
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(ver.createdAt))}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-[10px] text-white/45">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(ver.createdAt, lang)}
                        </span>
                        <span>{t("dw.ver.citedSources", { count: ver.sourceCount })}</span>
                        <span>
                          {t("dw.ver.conf", {
                            value: ver.overallConfidence ? `${Math.round(ver.overallConfidence * 100)}%` : t("dw.ver.na"),
                          })}
                        </span>
                      </div>

                      {hasAlert && (
                        <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-2 text-[10px] leading-relaxed text-amber-300">
                          {hasAlert.message}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // Diff Mode View
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsDiffMode(false)}
                  className="text-xs font-bold uppercase tracking-wider text-white/55 hover:text-white transition-colors"
                >
                  {t("dw.ver.backToTimeline")}
                </button>
                <span className="text-xs font-bold uppercase tracking-widest text-orange-400">
                  {t("dw.ver.versionDiff")}
                </span>
              </div>

              {/* Version Select Dropdowns */}
              <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/45 mb-1.5">
                    {t("dw.ver.baseSnapshot")}
                  </label>
                  <select
                    value={baseVersion || ""}
                    onChange={(e) => setBaseVersion(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/15 bg-[#121212] p-2 text-xs font-bold text-white focus:border-orange-500 outline-none"
                  >
                    {versions.map((v) => (
                      <option key={v.id} value={v.versionNumber}>
                        V{v.versionNumber} ({formatDate(v.createdAt, lang)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/45 mb-1.5">
                    {t("dw.ver.targetSnapshot")}
                  </label>
                  <select
                    value={targetVersion || ""}
                    onChange={(e) => setTargetVersion(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/15 bg-[#121212] p-2 text-xs font-bold text-white focus:border-orange-500 outline-none"
                  >
                    {versions.map((v) => (
                      <option key={v.id} value={v.versionNumber}>
                        V{v.versionNumber} ({formatDate(v.createdAt, lang)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {diffQuery.isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-white/45">
                  <svg className="animate-spin h-5 w-5 text-orange-500 mb-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-xs">{t("dw.ver.computingDiff")}</p>
                </div>
              ) : diffQuery.data ? (
                <div className="space-y-6">
                  {/* Score Drift */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/45 mb-3 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-orange-400" />
                      {t("dw.ver.scoreDrift")}
                    </h3>
                    {(!diffQuery.data.diff?.scores || diffQuery.data.diff.scores.length === 0) ? (
                      <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-center text-xs text-white/40">
                        {t("dw.ver.noScoreDrift")}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {diffQuery.data.diff.scores.map((score: ScoreDiff) => (
                          <div
                            key={score.dimension}
                            className="rounded-xl border border-white/5 bg-white/5 p-3.5"
                          >
                            <span className="text-xs font-bold text-white">{score.dimension}</span>
                            <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                              {/* Entity A */}
                              <div className="border-r border-white/10 pr-2">
                                <span className="text-[10px] text-white/45 font-semibold uppercase">{t("dw.ver.entityA")}</span>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-white/60">{score.oldA} → {score.newA}</span>
                                  <span
                                    className={`font-mono text-[10px] font-bold ${
                                      score.deltaA > 0
                                        ? "text-emerald-400"
                                        : score.deltaA < 0
                                        ? "text-red-400"
                                        : "text-white/40"
                                    }`}
                                  >
                                    {score.deltaA > 0 ? `+${score.deltaA}` : score.deltaA}
                                  </span>
                                </div>
                              </div>
                              {/* Entity B */}
                              <div>
                                <span className="text-[10px] text-white/45 font-semibold uppercase">{t("dw.ver.entityB")}</span>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-white/60">{score.oldB} → {score.newB}</span>
                                  <span
                                    className={`font-mono text-[10px] font-bold ${
                                      score.deltaB > 0
                                        ? "text-emerald-400"
                                        : score.deltaB < 0
                                        ? "text-red-400"
                                        : "text-white/40"
                                    }`}
                                  >
                                    {score.deltaB > 0 ? `+${score.deltaB}` : score.deltaB}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fact Deltas */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/45 mb-3 flex items-center gap-1.5">
                      <GitCompare className="h-3.5 w-3.5 text-orange-400" />
                      {t("dw.ver.factVariations")}
                    </h3>
                    <div className="space-y-4">
                      {/* Added Facts */}
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1 mb-2">
                          <Plus className="h-3 w-3" />
                          {t("dw.ver.addedFacts", { count: diffQuery.data.diff?.facts?.added?.length || 0 })}
                        </span>
                        {!diffQuery.data.diff?.facts?.added || diffQuery.data.diff.facts.added.length === 0 ? (
                          <p className="text-[11px] text-white/30 italic pl-4">{t("dw.ver.noAddedFacts")}</p>
                        ) : (
                          <ul className="space-y-2 pl-2">
                            {diffQuery.data.diff.facts.added.map((f, i) => (
                              <li key={i} className="text-xs text-white/75 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2.5">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                    {f.entity === "a" ? t("dw.ver.entityA") : t("dw.ver.entityB")} • {f.dimension}
                                  </span>
                                  <span className="text-[9px] text-white/30 truncate max-w-[200px]">{f.source}</span>
                                </div>
                                <p className="leading-relaxed">{f.value}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Removed Facts */}
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1 mb-2">
                          <Minus className="h-3 w-3" />
                          {t("dw.ver.removedFacts", { count: diffQuery.data.diff?.facts?.removed?.length || 0 })}
                        </span>
                        {!diffQuery.data.diff?.facts?.removed || diffQuery.data.diff.facts.removed.length === 0 ? (
                          <p className="text-[11px] text-white/30 italic pl-4">{t("dw.ver.noRemovedFacts")}</p>
                        ) : (
                          <ul className="space-y-2 pl-2">
                            {diffQuery.data.diff.facts.removed.map((f, i) => (
                              <li key={i} className="text-xs text-white/60 bg-red-500/5 border border-red-500/10 rounded-xl p-2.5">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                                    {f.entity === "a" ? t("dw.ver.entityA") : t("dw.ver.entityB")} • {f.dimension}
                                  </span>
                                  <span className="text-[9px] text-white/30 truncate max-w-[200px]">{f.source}</span>
                                </div>
                                <p className="leading-relaxed">{f.value}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
