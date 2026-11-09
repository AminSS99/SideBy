import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Copy, ReceiptText } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { copyText } from "@/lib/clipboard";
import { toast } from "sonner";
import type { ComparisonData } from "./types";
import { safeHref } from "@/lib/safe-url";

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
function choiceEntityName(matrix: SavedMatrix | null, result: ComparisonData) {
  if (!matrix) return null;
  const winner = pickWinner(matrix.result?.winner);
  if (winner === "tie") return "Tie";
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
      if (!res.ok) throw new Error("Unable to load saved decisions.");
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
          name: `My decision — ${choice === "a" ? result.entities.a.name : result.entities.b.name}`,
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
      if (!res.ok) throw new Error("Your decision could not be recorded. Try again.");
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
        throw new Error("The saved decision came back in an unexpected shape and was not shown.");
      }
      prependMatrix((data as { matrix: SavedMatrix }).matrix);
      setChoice("");
      setRationale("");
      toast.success("Your decision is recorded.", {
        description: "It stays distinct from the AI recommendation.",
      });
    } catch (error) {
      toast.error("Unable to record your decision.", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      recordingRef.current = false;
      setIsRecording(false);
    }
  };

  const topSources = result.sources.slice(0, 4);
  const recordDate = useMemo(() => {
    const date = new Date(isHistorical && version ? version.createdAt : result.updatedAt);
    return Number.isFinite(date.getTime()) ? date.toLocaleDateString() : "Unknown date";
  }, [isHistorical, result.updatedAt, version]);

  const receiptText = useMemo(() => {
    const lines = [
      `Decision receipt — ${result.query}`,
      isHistorical
        ? version
          ? `Recorded against snapshot Version ${version.versionNumber} (snapshot date ${recordDate}) — point-in-time reference`
          : `Historical snapshot${versionNumber !== undefined ? ` Version ${versionNumber}` : ""} — version details unavailable; treat as the recorded past`
        : `Live comparison as of ${recordDate} — not an immutable snapshot; future refreshes may update it`,
      `Question: ${result.query}`,
      `Decision context: ${result.context?.trim() ? result.context : "None recorded"}`,
      "",
      `AI recommendation: ${result.verdict.bestOverall || "No single recommendation"}`,
      result.verdict.summary,
      "",
      userChoice
        ? `Your recorded decision: ${choiceEntityName(userChoice, result) ?? "No winner"} — ${typeof userChoice.result?.rationale === "string" && userChoice.result.rationale ? `because ${userChoice.result.rationale}` : "no rationale recorded"} (saved ${new Date(userChoice.updatedAt).toLocaleDateString()}, recorded reference: ${userChoice.result?.recordedAgainst === "live" ? "live comparison" : String(userChoice.result?.recordedAgainst || "comparison record")})`
        : latestScenario
          ? `Your recorded decision: not recorded yet (a saved weighted scenario “${latestScenario.name}” exists but is not your decision)`
          : "Your recorded decision: not recorded yet (the recommendation above is SideBy's, not yours)",
      "",
      "Evidence references:",
      ...(topSources.length
        ? topSources.map((source) => `- ${source.title || source.url} (${source.url})`)
        : ["- No sources attached to this record."]),
    ];
    return lines.join("\n");
  }, [latestScenario, recordDate, result, topSources, userChoice, version, versionNumber, isHistorical]);

  const onCopy = async () => {
    const ok = await copyText(receiptText);
    setCopied(ok);
    if (ok) window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section aria-label="Decision receipt" className="rounded-sm border border-[#2a2a2a] bg-[#111] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ReceiptText className="h-4 w-4 text-orange-500" aria-hidden="true" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Decision receipt</p>
        </div>
        <button
          type="button"
          onClick={() => void onCopy()}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-[#333] bg-[#0c0b0a] px-2.5 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/60 transition-colors hover:border-orange-500/40 hover:text-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          {copied ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/35">Question</dt>
          <dd className="mt-1 font-serif text-base leading-snug text-[#fdfbf7]">{result.query}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/35">Decision context</dt>
          <dd className="mt-1 text-xs leading-relaxed text-[#fdfbf7]/65">
            {result.context?.trim() ? result.context : "None recorded"}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/35">AI recommendation</dt>
          <dd className="mt-1 text-xs leading-relaxed text-[#fdfbf7]/75">
            {result.verdict.bestOverall || "No single recommendation"} — {result.verdict.summary}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/35">Your recorded decision</dt>
          <dd className="mt-1 text-xs leading-relaxed text-[#fdfbf7]/75">
            {fetchState === "loading" && "Checking your saved decisions…"}
            {fetchState === "error" && (
              <span className="inline-flex items-start gap-1.5 text-amber-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Saved decisions couldn't be loaded. The record above still stands; retry by reopening this
                comparison.
              </span>
            )}
            {fetchState === "ready" && userChoice && (
              <>
                {choiceEntityName(userChoice, result) ?? "No winner"}
                {typeof userChoice.result?.rationale === "string" && userChoice.result.rationale
                  ? ` — ${userChoice.result.rationale}` : ""}
                {" "}(saved {new Date(userChoice.updatedAt).toLocaleDateString()}
                {userChoice.result?.recordedAgainst === "live"
                  ? ", against the live comparison"
                  : typeof userChoice.result?.recordedAgainst === "string" &&
                      userChoice.result.recordedAgainst === `version:${version?.id ?? ""}`
                    ? ", against this snapshot"
                    : ", against the comparison"}
                {isHistorical ? "; choices belong to the comparison, not to one frozen snapshot" : ""})
              </>
            )}
            {fetchState === "ready" && !userChoice && (
              <>
                Not recorded yet.
                {latestScenario ? (
                  <> A saved weighted scenario (“{latestScenario.name}”) exists below, but it is a scenario, not your decision.</>
                ) : (
                  <> The recommendation above is SideBy's, not yours.</>
                )}
              </>
            )}
          </dd>
        </div>
        {fetchState === "ready" && !userChoice && (
          <div className="rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/45">Record your decision</p>
            <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Which option do you choose">
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
              Why <span className="text-[#fdfbf7]/25">(optional)</span>
            </label>
            <input
              id="receipt-rationale"
              type="text"
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
              maxLength={280}
              placeholder="One line is enough, e.g. Cheaper at our scale"
              className="mt-1 h-10 w-full rounded-sm border border-[#333] bg-[#0c0b0a] px-3 text-xs text-[#fdfbf7] outline-none placeholder:text-white/25 focus:border-orange-500"
            />
            <button
              type="button"
              onClick={() => void recordDecision()}
              disabled={!choice || isRecording}
              className="mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-sm bg-orange-500 px-3 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-orange-400 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            >
              {isRecording ? "Recording…" : "Record my decision"}
            </button>
          </div>
        )}
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/35">Evidence</dt>
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
              <span className="text-xs text-[#fdfbf7]/50">No sources attached to this record.</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/35">Record</dt>
          <dd className="mt-1 text-xs text-[#fdfbf7]/50">
            {isHistorical
              ? version
                ? `Frozen snapshot Version ${version.versionNumber} (recorded ${recordDate}). A recorded decision below was saved against the comparison, not frozen with this snapshot. `
                : `Historical snapshot${versionNumber !== undefined ? ` Version ${versionNumber}` : ""} (details still loading). Treat evidence below as the recorded past, not current research. `
              : `Live record as of ${recordDate} — not a frozen snapshot; refreshing or re-running research changes what you see here. `}
            {result.sourceCount} sources at time of research
          </dd>
        </div>
      </dl>
    </section>
  );
}
