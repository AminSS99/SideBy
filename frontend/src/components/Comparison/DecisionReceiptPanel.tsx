import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Copy, ReceiptText } from "@/components/icons";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { copyText } from "@/lib/clipboard";
import { toast } from "sonner";
import type { ComparisonData } from "./types";
import { safeHref } from "@/lib/safe-url";
import { formatDate, useI18n } from "@/i18n";

/**
 * Decision receipt (F01), bound to an explicit record.
 *
 * Three things are deliberately separate and labeled as such:
 * - The AI recommendation (SideBy's recorded verdict).
 * - A saved weighted scenario (a decision-matrix template someone stored).
 * - The user's recorded decision (an explicit "I choose X because Y",
 *   stored through the same authorized decision-matrices endpoint with a
 *   `recordedAs: "user-choice"` marker). Stored without that marker, a
 *   matrix is NEVER presented as the user's decision.
 *
 * The receipt binds to one record: a historical version (by id + number +
 * recorded date) or the live comparison, which is labeled as unfrozen —
 * refreshing or re-running research changes it, and this receipt does not
 * claim otherwise. Nothing here rewrites the record it renders.
 */

export type ReceiptVersion = {
  id: string;
  versionNumber: number;
  createdAt: string;
} | null;

type SavedMatrix = {
  id: string;
  name: string;
  weights: Record<string, number>;
  result: {
    winner?: unknown;
    recordedAs?: unknown;
    rationale?: unknown;
    /** "live" or "version:<id>" — the record this choice was saved against. */
    recordedAgainst?: unknown;
    /** Entity names as they were when chosen; never re-derived later. */
    choiceEntities?: { a?: unknown; b?: unknown } | null;
  } | null;
  updatedAt: string;
};

const pickWinner = (value: unknown): "a" | "b" | "tie" | null =>
  value === "a" || value === "b" || value === "tie" ? value : null;

/**
 * A recorded choice displays the entity names frozen at save time
 * (choiceEntities) when present, falling back to the current record's
 * names only for choices saved before snapshots existed.
 */
function choiceEntityName(matrix: SavedMatrix | null, result: ComparisonData, tieLabel: string) {
  if (!matrix) return null;
  const winner = pickWinner(matrix.result?.winner);
  if (winner === "tie") return tieLabel;
  if (!winner) return null;
  const snapshot = matrix.result?.choiceEntities;
  const frozen = winner === "a" ? snapshot?.a : snapshot?.b;
  if (typeof frozen === "string" && frozen.length > 0) return frozen;
  return winner === "a" ? result.entities.a.name : result.entities.b.name;
}

export function DecisionReceiptPanel({
  result,
  comparisonId,
  version,
  versionNumber,
  isHistorical,
}: {
  result: ComparisonData;
  comparisonId: string;
  version: ReceiptVersion;
  versionNumber?: number;
  isHistorical: boolean;
}) {
  const { t, lang } = useI18n();
  const [copied, setCopied] = useState(false);
  const [choice, setChoice] = useState<"a" | "b" | "">("");
  const [rationale, setRationale] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef(false);
  const queryClient = useQueryClient();

  // Shared data ownership: desktop and mobile trees mount this panel
  // simultaneously (one is only CSS-hidden), so the fetch lives in the
  // query cache keyed by comparison — one request, one identity, no two
  // independently fetched copies disagreeing about the same record.
  const matricesQuery = useQuery({
    queryKey: ["decision-matrices", comparisonId],
    queryFn: async () => {
      const res = await apiFetch(buildApiUrl(`/api/decision-matrices?comparisonId=${comparisonId}`));
      if (!res.ok) throw new Error(t("dw.rec.err.load"));
      const data = (await res.json()) as { matrices: SavedMatrix[] };
      return Array.isArray(data.matrices) ? data.matrices : [];
    },
  });
  const matrices = useMemo(() => matricesQuery.data ?? [], [matricesQuery.data]);
  const fetchState: "loading" | "error" | "ready" = matricesQuery.isPending
    ? "loading"
    : matricesQuery.isError
      ? "error"
      : "ready";

  // Recording a choice updates the shared cache, so every mounted copy
  // (and the decision matrix panel) sees one consistent record.
  const prependMatrix = (matrix: SavedMatrix) => {
    queryClient.setQueryData<SavedMatrix[]>(["decision-matrices", comparisonId], (current) => [
      matrix,
      ...(current ?? []).filter((item) => item.id !== matrix.id),
    ]);
  };

  // Reset the local choice form on identity change; never carry an
  // unsubmitted pick across records.
  useEffect(() => {
    setChoice("");
    setRationale("");
  }, [comparisonId]);

  const userChoice = useMemo(
    () => matrices.find((matrix) => matrix.result?.recordedAs === "user-choice") ?? null,
    [matrices],
  );
  const latestScenario = useMemo(
    () => matrices.find((matrix) => matrix.result?.recordedAs !== "user-choice") ?? null,
    [matrices],
  );

  const recordDecision = async () => {
    // Synchronous lock: repeat clicks, double-taps and assistive-tech
    // re-activation cannot submit twice while state settles.
    if (!choice || recordingRef.current) return;
    recordingRef.current = true;
    setIsRecording(true);
    try {
      const res = await apiFetch(buildApiUrl("/api/decision-matrices"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comparisonId,
          name: t("dw.rec.myDecisionName", {
            name: choice === "a" ? result.entities.a.name : result.entities.b.name,
          }),
          weights: {},
          result: {
            winner: choice,
            recordedAs: "user-choice",
            rationale: rationale.trim() || undefined,
            recordedAgainst: isHistorical && version ? `version:${version.id}` : "live",
            // Entity names frozen at save time: a later alias/editorial
            // refresh can never reinterpret this choice against renamed
            // entities.
            choiceEntities: { a: result.entities.a.name, b: result.entities.b.name },
          },
        }),
      });
      if (!res.ok) throw new Error(t("dw.rec.err.record"));
      const data: unknown = await res.json();
      if (
        typeof data !== "object" ||
        data === null ||
        !("matrix" in data) ||
        typeof (data as { matrix?: unknown }).matrix !== "object" ||
        (data as { matrix: unknown }).matrix === null ||
        typeof ((data as { matrix: Record<string, unknown> }).matrix.id) !== "string" ||
        ((data as { matrix: { result: { recordedAs?: unknown } | null } }).matrix.result?.recordedAs !==
          "user-choice")
      ) {
        throw new Error(t("dw.rec.err.unexpectedShape"));
      }
      prependMatrix((data as { matrix: SavedMatrix }).matrix);
      setChoice("");
      setRationale("");
      toast.success(t("dw.rec.toast.recorded"), {
        description: t("dw.rec.toast.recordedDesc"),
      });
    } catch (error) {
      toast.error(t("dw.rec.toast.recordFailed"), {
        description: error instanceof Error ? error.message : t("dw.rec.err.tryAgain"),
      });
    } finally {
      recordingRef.current = false;
      setIsRecording(false);
    }
  };

  const topSources = result.sources.slice(0, 4);
  const recordDate = useMemo(() => {
    const formatted = formatDate(isHistorical && version ? version.createdAt : result.updatedAt, lang);
    return formatted || t("dw.rec.unknownDate");
  }, [isHistorical, lang, result.updatedAt, t, version]);

  const receiptText = useMemo(() => {
    const tieLabel = t("res.cat.tie");
    const lines = [
      t("dw.rec.copy.header", { query: result.query }),
      isHistorical
        ? version
          ? t("dw.rec.copy.histVersion", { version: version.versionNumber, date: recordDate })
          : versionNumber !== undefined
            ? t("dw.rec.copy.histLoadingVer", { version: versionNumber })
            : t("dw.rec.copy.histLoading")
        : t("dw.rec.copy.live", { date: recordDate }),
      t("dw.rec.copy.question", { query: result.query }),
      t("dw.rec.copy.context", {
        context: result.context?.trim() ? result.context : t("dw.rec.noneRecorded"),
      }),
      "",
      t("dw.rec.copy.aiRec", {
        rec: result.verdict.bestOverall || t("dw.rec.noSingleRec"),
      }),
      result.verdict.summary,
      "",
      userChoice
        ? t("dw.rec.copy.yourDecision", {
            choice: choiceEntityName(userChoice, result, tieLabel) ?? t("dw.rec.noWinner"),
            rationale:
              typeof userChoice.result?.rationale === "string" && userChoice.result.rationale
                ? t("dw.rec.copy.because", { rationale: userChoice.result.rationale })
                : t("dw.rec.copy.noRationale"),
            date: formatDate(userChoice.updatedAt, lang),
            ref:
              userChoice.result?.recordedAgainst === "live"
                ? t("dw.rec.copy.refLive")
                : String(userChoice.result?.recordedAgainst || t("dw.rec.copy.refRecord")),
          })
        : latestScenario
          ? t("dw.rec.copy.notRecordedScenario", { name: latestScenario.name })
          : t("dw.rec.copy.notRecorded"),
      "",
      t("dw.rec.copy.evidence"),
      ...(topSources.length
        ? topSources.map((source) => `- ${source.title || source.url} (${source.url})`)
        : [t("dw.rec.copy.noSources")]),
    ];
    return lines.join("\n");
  }, [isHistorical, lang, latestScenario, recordDate, result, t, topSources, userChoice, version, versionNumber]);

  const onCopy = async () => {
    const ok = await copyText(receiptText);
    setCopied(ok);
    if (ok) window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section aria-label={t("dw.rec.aria")} className="rounded-sm border border-[#2a2a2a] bg-[#111] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ReceiptText className="h-4 w-4 text-orange-500" aria-hidden="true" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">{t("dw.rec.title")}</p>
        </div>
        <button
          type="button"
          onClick={() => void onCopy()}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-[#333] bg-[#0c0b0a] px-2.5 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/60 transition-colors hover:border-orange-500/40 hover:text-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          {copied ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          {copied ? t("dw.rec.copied") : t("dw.rec.copyBtn")}
        </button>
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/35">{t("dw.rec.question")}</dt>
          <dd className="mt-1 font-serif text-base leading-snug text-[#fdfbf7]">{result.query}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/35">{t("dw.rec.context")}</dt>
          <dd className="mt-1 text-xs leading-relaxed text-[#fdfbf7]/65">
            {result.context?.trim() ? result.context : t("dw.rec.noneRecorded")}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/35">{t("dw.rec.aiRec")}</dt>
          <dd className="mt-1 text-xs leading-relaxed text-[#fdfbf7]/75">
            {result.verdict.bestOverall || t("dw.rec.noSingleRec")} — {result.verdict.summary}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/35">{t("dw.rec.yourDecision")}</dt>
          <dd className="mt-1 text-xs leading-relaxed text-[#fdfbf7]/75">
            {fetchState === "loading" && t("dw.rec.checking")}
            {fetchState === "error" && (
              <span className="inline-flex items-start gap-1.5 text-amber-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {t("dw.rec.loadError")}
              </span>
            )}
            {fetchState === "ready" && userChoice && (
              <>
                {choiceEntityName(userChoice, result, t("res.cat.tie")) ?? t("dw.rec.noWinner")}
                {typeof userChoice.result?.rationale === "string" && userChoice.result.rationale
                  ? ` — ${userChoice.result.rationale}` : ""}
                {" "}
                {(() => {
                  const savedDate = formatDate(userChoice.updatedAt, lang);
                  const note = isHistorical ? t("dw.rec.histChoiceNote") : "";
                  if (userChoice.result?.recordedAgainst === "live") {
                    return t("dw.rec.savedAgainstLive", { date: savedDate, note });
                  }
                  if (
                    typeof userChoice.result?.recordedAgainst === "string" &&
                    userChoice.result.recordedAgainst === `version:${version?.id ?? ""}`
                  ) {
                    return t("dw.rec.savedAgainstSnapshot", { date: savedDate, note });
                  }
                  return t("dw.rec.savedAgainstComparison", { date: savedDate, note });
                })()}
              </>
            )}
            {fetchState === "ready" && !userChoice && (
              <>
                {latestScenario
                  ? t("dw.rec.notRecordedScenario", { name: latestScenario.name })
                  : t("dw.rec.notRecorded")}
              </>
            )}
          </dd>
        </div>
        {fetchState === "ready" && !userChoice && (
          <div className="rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/45">{t("dw.rec.recordTitle")}</p>
            <div className="mt-2 flex gap-2" role="radiogroup" aria-label={t("dw.rec.chooseAria")}>
              {(["a", "b"] as const).map((entity) => (
                <button
                  key={entity}
                  type="button"
                  role="radio"
                  aria-checked={choice === entity}
                  onClick={() => setChoice(entity)}
                  className={`inline-flex min-h-10 flex-1 items-center justify-center rounded-sm border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                    choice === entity
                      ? "border-orange-500/60 bg-orange-500/15 text-orange-200"
                      : "border-[#333] bg-transparent text-[#fdfbf7]/60 hover:border-orange-500/30"
                  }`}
                >
                  {entity === "a" ? result.entities.a.name : result.entities.b.name}
                </button>
              ))}
            </div>
            <label htmlFor="receipt-rationale" className="mt-2 block text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/35">
              {t("dw.rec.why")} <span className="text-[#fdfbf7]/25">{t("dw.rec.optional")}</span>
            </label>
            <input
              id="receipt-rationale"
              type="text"
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
              maxLength={280}
              placeholder={t("dw.rec.whyPlaceholder")}
              className="mt-1 h-10 w-full rounded-sm border border-[#333] bg-[#0c0b0a] px-3 text-xs text-[#fdfbf7] outline-none placeholder:text-white/25 focus:border-orange-500"
            />
            <button
              type="button"
              onClick={() => void recordDecision()}
              disabled={!choice || isRecording}
              className="mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-sm bg-orange-500 px-3 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-orange-400 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            >
              {isRecording ? t("dw.rec.recording") : t("dw.rec.recordBtn")}
            </button>
          </div>
        )}
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/35">{t("dw.rec.evidence")}</dt>
          <dd className="mt-1 space-y-1.5">
            {topSources.length ? (
              topSources.map((source) => (
                <a
                  key={source.url}
                  href={safeHref(source.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-xs text-orange-300/80 underline decoration-orange-500/25 underline-offset-4 hover:text-orange-200"
                >
                  {source.title || source.url}
                </a>
              ))
            ) : (
              <span className="text-xs text-[#fdfbf7]/50">{t("dw.rec.noSources")}</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/35">{t("dw.rec.recordLabel")}</dt>
          <dd className="mt-1 text-xs text-[#fdfbf7]/50">
            {isHistorical
              ? version
                ? t("dw.rec.recordFrozen", { version: version.versionNumber, date: recordDate })
                : versionNumber !== undefined
                  ? t("dw.rec.recordHistLoadingVer", { version: versionNumber })
                  : t("dw.rec.recordHistLoading")
              : t("dw.rec.recordLive", { date: recordDate })}{" "}
            {t("dw.rec.sourcesCount", { count: result.sourceCount })}
          </dd>
        </div>
      </dl>
    </section>
  );
}
