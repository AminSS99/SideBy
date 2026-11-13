import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Copy, Eye, ExternalLink, LockKeyhole, Share2, X } from "@/components/icons";
import { buildShareUrl } from "@/config/brand";
import { buildApiUrl } from "@/config/env";
import { apiFetch } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import { projectPublicResult } from "@/lib/publicComparison";
import type { ComparisonData } from "@/components/Comparison/types";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShareModalProps {
  opens: boolean;
  onClose: () => void;
  entityA: string;
  entityB: string;
  slug?: string | null;
  comparisonId?: string | null;
  isPublic?: boolean;
  result?: ComparisonData | null;
  /** Server-computed publish blockers (privacy gate), when known. */
  eligibilityReasons?: string[];
  /** Server-computed eligibility classification when known ("not-public-input" enables the snapshot path). */
  eligibilityClassification?: string | null;
}

const resolveShareUrl = (slug?: string | null) => {
  const safeSlug = slug?.replace(/^\/+/, "") || "comparison";
  if (typeof window !== "undefined" && window.location.hostname !== "sideby.ink") {
    return `${window.location.origin}/compare/${safeSlug}`;
  }

  return buildShareUrl(safeSlug);
};

/**
 * Sharing is an explicit, reversible state change.
 *
 * - Publish, Copy public link, Open public page and Make private are
 *   separate actions. Copy and Open never change visibility on their own:
 *   when the record is private they stay disabled until an explicit,
 *   labeled Publish runs first.
 * - The preview renders the shared public projection — the same allowlist
 *   contract the server serves — so "what you see is what publishes".
 *   When the record cannot be projected safely, publishing is unavailable.
 * - Public reads are noncached authoritative reads: unpublishing stops new
 *   visits on the very next request. Nothing can recall copies someone
 *   already downloaded or re-shared outside SideBy, and the UI says exactly
 *   that instead of promising instant recall.
 */
const ShareModal = ({ opens, onClose, entityA, entityB, slug, comparisonId, isPublic = false, result, eligibilityReasons, eligibilityClassification }: ShareModalProps) => {
  const [publicNow, setPublicNow] = useState(isPublic);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [snapshotState, setSnapshotState] = useState<"idle" | "working" | "error">("idle");
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [snapshotApproved, setSnapshotApproved] = useState(false);
  const snapshotWorkingRef = useRef(false);
  const navigate = useNavigate();
  const url = resolveShareUrl(slug);

  // A new record must never inherit the previous record's state or error.
  useEffect(() => {
    if (opens) {
      setPublicNow(isPublic);
      setPublishError(null);
      setCopied(false);
      setIsWorking(false);
      setSnapshotState("idle");
      setSnapshotError(null);
      setSnapshotApproved(false);
    }
  }, [opens, isPublic, slug, comparisonId]);

  const projected = useMemo(() => (result ? projectPublicResult(result) : null), [result]);
  const canPublish = Boolean(comparisonId && (!result || projected));

  /**
   * Records generated from a private brief can never publish directly: the
   * draft wording reached every summary and claim via the pipeline. The
   * server-authorized way out is a fresh public snapshot built from only the
   * two option names (server-constructed input, stamped 'public').
   */
  const requiresSnapshot = eligibilityClassification === "not-public-input" && !publicNow;

  const generateSnapshot = async () => {
    if (!comparisonId) {
      setSnapshotError("Save the comparison before generating a snapshot.");
      return;
    }
    // Synchronous duplicate guard: state updates can't land before the
    // second click of a double-tap, so a ref decides, not the render.
    if (snapshotWorkingRef.current) return;
    snapshotWorkingRef.current = true;
    try {
      setSnapshotState("working");
      setSnapshotError(null);
      const res = await apiFetch(
        buildApiUrl(`/api/comparisons/${comparisonId}/public-snapshot`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmed: true }),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(
          typeof data?.error === "string" && data.error
            ? data.error
            : "Unable to generate a public snapshot.",
        );
      }
      const data = (await res.json()) as { id?: string };
      if (!data.id) {
        throw new Error("The snapshot response was incomplete. Please try again.");
      }
      // The snapshot is its own record: continue on its page, where the run
      // status and the (then-)publish step live.
      setSnapshotState("idle");
      navigate(`/comparisons/${data.id}`);
      onClose();
    } catch (error) {
      setSnapshotState("error");
      setSnapshotError(
        error instanceof Error ? error.message : "Snapshot generation failed. Please try again.",
      );
    } finally {
      snapshotWorkingRef.current = false;
    }
  };

  const setVisibility = async (action: "publish" | "unpublish") => {
    if (!comparisonId) {
      setPublishError("This comparison can't change visibility yet.");
      return false;
    }
    try {
      setIsWorking(true);
      setPublishError(null);
      const res = await apiFetch(buildApiUrl(`/api/comparisons/${comparisonId}/visibility`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        throw new Error(
          action === "publish"
            ? "Unable to publish this comparison."
            : "Unable to make this comparison private.",
        );
      }
      setPublicNow(action === "publish");
      return true;
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : "Visibility change failed. Please try again.");
      return false;
    } finally {
      setIsWorking(false);
    }
  };

  const copy = async () => {
    if (!publicNow) return;
    const ok = await copyText(url);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      setPublishError("Clipboard permission is blocked. Select and copy the URL manually.");
    }
  };

  const open = () => {
    const win = window.open(url, "_blank", "noopener");
    if (!win) {
      setPublishError("The popup was blocked. Copy the link and open it manually.");
    }
  };

  const categoryWinner = (winner: "a" | "b" | "tie") =>
    winner === "tie" ? "Tie" : winner === "a" ? entityA : entityB;

  return (
    <Dialog open={opens} onOpenChange={(value) => { if (!value) onClose(); }}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 motion-reduce:animate-none" />
        <DialogContent
          className="fixed left-1/2 top-1/2 z-[110] max-h-[calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 motion-reduce:animate-none"
        >
          <div className="mb-1 flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="font-serif text-lg text-white">Share comparison</DialogTitle>
              <DialogDescription className="mt-1 text-xs leading-relaxed text-white/50">
                Publishing shows exactly the record previewed below. Private notes, uploads and your saved
                decisions stay private.
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <button
                type="button"
                aria-label="Close share dialog"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.05] hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </DialogClose>
          </div>

          <div className="mb-5 mt-4 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            {publicNow ? (
              <>
                <Eye className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                <p className="text-xs leading-relaxed text-white/60">
                  <span className="font-semibold text-emerald-300">Public.</span> Anyone with the link can view
                  the record below.
                </p>
              </>
            ) : (
              <>
                <LockKeyhole className="h-4 w-4 shrink-0 text-white/40" aria-hidden="true" />
                <p className="text-xs leading-relaxed text-white/60">
                  <span className="font-semibold text-white/80">Private.</span> Only you can see this record.
                  Nothing is published until you choose Publish.
                </p>
              </>
            )}
          </div>

          <div className="mb-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/25">
              What the public sees
            </p>
            <div className="rounded-lg border border-white/[0.04] bg-[#050505] p-3">
              <p className="mb-1 font-serif text-sm text-white">
                {entityA}
                <span className="mx-1.5 text-[10px] italic text-white/20">vs</span>
                {entityB}
              </p>
              {result && !projected ? (
                <p className="text-[11px] leading-relaxed text-amber-300">
                  This record can't be published in its current form — the public projection rejected it. Keep
                  it private or re-run research.
                </p>
              ) : projected ? (
                <>
                  <p className="text-[11px] leading-relaxed text-white/50">
                    {typeof projected.verdict === "object" && projected.verdict !== null && "summary" in projected.verdict && typeof (projected.verdict as Record<string, unknown>).summary === "string" ? (
                      <>{(projected.verdict as { bestOverall?: string; summary: string }).bestOverall ? `Recommendation: ${(projected.verdict as { bestOverall?: string }).bestOverall}. ` : ""}{(projected.verdict as { summary: string }).summary}</>
                    ) : (
                      "SideBy · Source-backed comparison engine"
                    )}
                  </p>
                  {projected.categories.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {projected.categories.map((category) => (
                        <li key={category.name} className="flex items-center justify-between gap-3 text-[11px]">
                          <span className="text-white/45">{category.name}</span>
                          <span className="font-semibold text-orange-300/90">
                            {categoryWinner(category.winner)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-3 text-[10px] leading-relaxed text-white/35">
                    {projected.sources.length} source{projected.sources.length === 1 ? "" : "s"} with titles, links
                    and retrieval dates. Question, verdict, category outcomes and sources only — your decision
                    context and saved decisions are never part of the public record.
                  </p>
                </>
              ) : (
                <p className="text-[10px] text-white/25">
                  SideBy · Source-backed comparison engine
                </p>
              )}
            </div>
          </div>

          {publicNow && (
            <div className="mb-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/25">
                Public URL
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg bg-white/[0.04] px-3 py-2 font-mono text-xs text-white/60">
                  {url}
                </code>
                <button
                  type="button"
                  onClick={() => void copy()}
                  aria-label="Copy public link"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] transition-all hover:border-orange-400/30 hover:bg-orange-400/[0.06]"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-white/40" />
                  )}
                </button>
              </div>
              {copied && (
                <p className="mt-2 text-[10px] font-bold text-emerald-400/80">
                  Copied to clipboard
                </p>
              )}
            </div>
          )}

          {publishError && (
            <p role="alert" className="mb-4 text-[11px] font-semibold leading-relaxed text-red-300">
              {publishError}
            </p>
          )}

          {!publicNow && (
            <p className="mb-4 text-[11px] leading-relaxed text-white/40">
              Public reads are never cached. Unpublishing later stops new visits on the very next request;
              anything someone already downloaded or re-shared outside SideBy can't be recalled.
            </p>
          )}

          {eligibilityReasons && eligibilityReasons.length > 0 && (
            <div role="note" className="mb-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300">Can't publish yet</p>
              <ul className="mt-2 space-y-1.5">
                {eligibilityReasons.map((reason) => (
                  <li key={reason} className="text-[11px] leading-relaxed text-amber-200/85">{reason}</li>
                ))}
              </ul>
            </div>
          )}

          {requiresSnapshot && (
            <div className="mb-4 rounded-xl border border-sky-400/25 bg-sky-400/[0.05] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-sky-300">Public snapshot</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-sky-200/85">
                A snapshot re-runs fresh research using only the two recorded option names — no written brief,
                priorities or uploads travel with it. The snapshot is its own record; publish it once the run
                completes. Research runs take a few minutes.
              </p>

              <div className="mt-2.5 rounded-lg border border-sky-400/20 bg-black/40 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-300/80 mb-1">
                  Option names to be researched and published:
                </p>
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <span className="truncate rounded bg-white/10 px-2 py-0.5">{entityA}</span>
                  <span className="text-[10px] text-white/40">vs</span>
                  <span className="truncate rounded bg-white/10 px-2 py-0.5">{entityB}</span>
                </div>
              </div>

              <p className="mt-2 text-[10px] leading-relaxed text-amber-300/90">
                Option names extracted from private input are not automatically public. Verify that neither option name exposes private project codes, client names, or confidential context.
              </p>

              <label className="mt-3 flex items-start gap-2.5 cursor-pointer text-[11px] leading-snug text-sky-100/90 select-none">
                <input
                  type="checkbox"
                  checked={snapshotApproved}
                  onChange={(e) => setSnapshotApproved(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-sky-400/40 bg-black/50 text-sky-400 accent-sky-400 focus:ring-sky-400"
                />
                <span>I confirm these exact option names are safe to publish and contain no private context.</span>
              </label>

              <button
                type="button"
                onClick={() => void generateSnapshot()}
                disabled={snapshotState === "working" || !snapshotApproved}
                title={!comparisonId ? "Save the comparison first" : !snapshotApproved ? "Review and approve the option names first" : undefined}
                className="mt-3 w-full rounded-xl bg-sky-300 py-2.5 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                {snapshotState === "working" ? "Generating…" : "Generate public snapshot"}
              </button>
              <p className="mt-2 text-[10px] leading-relaxed text-sky-200/60">
                Runs a real research job, so it counts as one comparison on your plan.
              </p>
            </div>
          )}

          {snapshotError && (
            <p role="alert" className="mb-4 text-[11px] font-semibold leading-relaxed text-red-300">
              {snapshotError}
            </p>
          )}

          <div className="flex gap-2">
            {publicNow ? (
              <button
                type="button"
                onClick={() => void setVisibility("unpublish")}
                disabled={isWorking}
                className="flex-1 rounded-xl border border-white/[0.08] bg-transparent py-2.5 text-xs font-bold uppercase tracking-widest text-white/60 transition-colors hover:border-red-400/30 hover:text-red-300 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
              >
                {isWorking ? "Working…" : "Make private"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void setVisibility("publish")}
                disabled={isWorking || !canPublish || Boolean(eligibilityReasons?.length)}
                title={!comparisonId ? "Save the comparison before publishing" : !projected && result ? "This record can't be published safely" : undefined}
                className="flex-1 rounded-xl bg-white py-2.5 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
              >
                {isWorking ? "Publishing…" : "Publish"}
              </button>
            )}
            <button
              type="button"
              onClick={open}
              disabled={!publicNow}
              title={!publicNow ? "Publish first — opening never publishes on its own" : undefined}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-transparent py-2.5 text-xs font-bold uppercase tracking-widest text-white/70 transition-colors hover:border-orange-400/25 hover:text-orange-200 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              Open page
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export const ShareButton = ({
  entityA,
  entityB,
  slug,
  comparisonId,
  isPublic,
  result,
  eligibilityReasons,
  eligibilityClassification,
  className,
}: {
  entityA: string;
  entityB: string;
  slug: string;
  comparisonId?: string | null;
  isPublic?: boolean;
  result?: ComparisonData | null;
  eligibilityReasons?: string[];
  eligibilityClassification?: string | null;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/50 transition-all hover:border-orange-400/25 hover:bg-orange-400/[0.05] hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${className || ""}`}
      >
        <Share2 className="h-3 w-3" aria-hidden="true" />
        Share
      </button>
      <ShareModal
        opens={open}
        onClose={() => setOpen(false)}
        entityA={entityA}
        entityB={entityB}
        slug={slug}
        comparisonId={comparisonId}
        isPublic={isPublic}
        result={result}
        eligibilityReasons={eligibilityReasons}
        eligibilityClassification={eligibilityClassification}
      />
    </>
  );
};

export default ShareModal;
