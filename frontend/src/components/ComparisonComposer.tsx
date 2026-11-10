import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  Link2,
  Loader2,
  Plus,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useComparisonValidation } from "@/hooks/useComparisonValidation";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { toast } from "sonner";
import { pwaUpdates } from "@/lib/pwa/register";
import { useDraftScope } from "@/hooks/useDraftScope";
import { KeyboardSpacer } from "@/components/KeyboardSpacer";

interface ComparisonComposerProps {
  onStart: (query: string) => void | Promise<void>;
  isCreating?: boolean;
  initialQuery?: string;
  className?: string;
}

const SUGGESTIONS = [
  "iPhone 16 vs Google Pixel 9 for photography",
  "React vs Vue for SaaS products",
  "LG C4 vs Samsung S90D for a bright living room",
  "Tesla Model 3 vs BMW i4 for daily commuting",
  "Portugal vs Spain for remote work",
];

const COMPARISON_TEMPLATES = [
  { label: "Phones", context: "photography and daily use" },
  { label: "Cars", context: "daily commuting" },
  { label: "AI tools", context: "an AI workflow" },
  { label: "Laptops", context: "software development" },
  { label: "Cities", context: "remote work" },
];

export function ComparisonComposer({
  onStart,
  isCreating = false,
  initialQuery = "",
  className = "",
}: ComparisonComposerProps) {
  const {
    entityA,
    setEntityA,
    entityB,
    setEntityB,
    context,
    setContext,
    serializedQuery,
    queryIntent,
    isValidating,
    isBlocked,
    isIncomplete,
    setFromFullQuery,
  } = useComparisonValidation({
    initialEntityA: initialQuery ? initialQuery.split(/\s+vs\.?\s+/i)[0]?.trim() : "",
    initialEntityB: initialQuery ? initialQuery.split(/\s+vs\.?\s+/i)[1]?.split(/\s+for\s+/i)[0]?.trim() : "",
    initialContext: initialQuery ? initialQuery.split(/\s+for\s+/i)[1]?.trim() : "",
  });

  const [showContextInput, setShowContextInput] = useState(Boolean(context));
  const [contextUrl, setContextUrl] = useState("");
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  // Optional decision constraints: kept separate from the required entity
  // inputs so the initial screen stays light. They ride along in the brief
  // (submitted query context + accountable draft) and never gate submission.
  const [priorities, setPriorities] = useState("");
  const [nonNegotiables, setNonNegotiables] = useState("");

  const importUrlContext = async () => {
    if (!contextUrl.trim()) return;
    try {
      setIsImportingUrl(true);
      const response = await apiFetch(buildApiUrl("/api/comparison-context"), {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: contextUrl.trim() }),
      });
      const data = await response.json() as { context?: string; source?: { title: string }; error?: string };
      if (!response.ok || !data.context) throw new Error(data.error || "Unable to import URL context.");
      setContext(data.context);
      setShowContextInput(true);
      toast.success("Requirements imported.", { description: `Grounded in ${data.source?.title || "the supplied URL"}.` });
    } catch (error) {
      toast.error("Unable to import URL context.", { description: error instanceof Error ? error.message : "Try a public HTTPS URL." });
    } finally { setIsImportingUrl(false); }
  };

  const [localSubmitting, setLocalSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const { scope: draftScope, isReady: isDraftScopeReady } = useDraftScope();
  const restoreAttemptedForScope = useRef<string | null>(null);

  // Register dirty state and draft saver with PWA update store to guard against accidental loss on refresh
  useEffect(() => {
    const unregisterChecker = pwaUpdates.registerDirtyChecker(() => {
      return Boolean(entityA.trim() || entityB.trim() || priorities.trim() || nonNegotiables.trim());
    });
    const unregisterSaver = pwaUpdates.registerDraftSaver(() => {
      if (!entityA.trim() && !entityB.trim()) return null;
      if (!draftScope) return null;
      return {
        key: "composer",
        data: { entityA, entityB, context, priorities, nonNegotiables },
        scope: draftScope,
      };
    });
    return () => {
      unregisterChecker();
      unregisterSaver();
    };
  }, [entityA, entityB, context, priorities, nonNegotiables, draftScope]);

  // Restore a preserved draft only once identity and workspace resolution are
  // complete. Never treats transient loading as anonymous identity.
  useEffect(() => {
    if (!isDraftScopeReady || !draftScope) return;
    const scopeKey = JSON.stringify(draftScope);
    if (restoreAttemptedForScope.current === scopeKey) return;
    restoreAttemptedForScope.current = scopeKey;
    const draft = pwaUpdates.getPreservedDraft<{
      entityA?: string;
      entityB?: string;
      context?: string;
      priorities?: string;
      nonNegotiables?: string;
    }>("composer", draftScope);
    if (draft && (draft.entityA || draft.entityB)) {
      if (draft.entityA) setEntityA(draft.entityA);
      if (draft.entityB) setEntityB(draft.entityB);
      if (draft.context) {
        setContext(draft.context);
        setShowContextInput(true);
      }
      if (draft.priorities) {
        setPriorities(draft.priorities);
        setShowContextInput(true);
      }
      if (draft.nonNegotiables) {
        setNonNegotiables(draft.nonNegotiables);
        setShowContextInput(true);
      }
      pwaUpdates.clearPreservedDraft("composer");
      toast.info("Restored your unsaved comparison draft.");
    }
  }, [isDraftScopeReady, draftScope, setEntityA, setEntityB, setContext]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !serializedQuery.trim() ||
      isBlocked ||
      isValidating ||
      isCreating ||
      localSubmitting ||
      isSubmittingRef.current
    ) {
      return;
    }

    isSubmittingRef.current = true;
    setLocalSubmitting(true);
    try {
      // Constraints stay inside the query's context segment so the brief the
      // server parses carries them verbatim.
      const constraints = [
        priorities.trim() ? `Priorities: ${priorities.trim()}` : "",
        nonNegotiables.trim() ? `Non-negotiables: ${nonNegotiables.trim()}` : "",
      ].filter(Boolean).join("; ");
      const finalQuery = constraints
        ? `${serializedQuery}${serializedQuery.includes(" for ") ? "; " : " for "}${constraints}`
        : serializedQuery;
      await onStart(finalQuery);
    } finally {
      // Coalesce rapid double taps before releasing the lock
      setTimeout(() => {
        isSubmittingRef.current = false;
        setLocalSubmitting(false);
      }, 600);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFromFullQuery(suggestion);
    setShowContextInput(suggestion.toLowerCase().includes(" for "));
  };

  const swapEntities = () => {
    const previousEntityA = entityA;
    setEntityA(entityB);
    setEntityB(previousEntityA);
  };

  const canSubmit =
    serializedQuery.trim().length > 0 &&
    !isBlocked &&
    !isValidating &&
    entityA.trim().length > 0 &&
    entityB.trim().length > 0 &&
    !isCreating &&
    !localSubmitting;

  return (
    <div className={cn("relative w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-white/[0.12] bg-[#0d0b0a]/92 p-4 shadow-[0_30px_100px_rgba(0,0,0,.55),0_0_80px_rgba(249,115,22,.08)] backdrop-blur-2xl sm:p-6", className)}>
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-orange-500/[0.12] blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-fuchsia-500/[0.07] blur-[100px]" />
      <div className="relative mb-5 flex items-center justify-between gap-4 px-1">
        <div className="text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300">Build your comparison</p>
          <p className="mt-1 text-xs text-white/65">Two options in. A defensible answer out.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-widest text-emerald-300 sm:px-3 sm:text-[9px]">
          <Sparkles className="h-3 w-3" /> Source backed
        </span>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-4">
        {/* Entity Inputs Row: on mobile, two full-width balanced inputs with a centered swap divider; on desktop, 3 columns */}
        <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-end sm:gap-x-2">
          <div className="relative w-full">
            <label htmlFor="hero-comparison-input" className="mb-2 block px-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/65">
              First option
            </label>
            <div className="relative">
              <Input
                id="hero-comparison-input"
                aria-label="First option"
                type="text"
                value={entityA}
                onChange={(e) => setEntityA(e.target.value)}
                placeholder="e.g. iPhone 16"
                autoComplete="off"
                className="h-14 rounded-xl border-white/[0.09] bg-black/50 pl-4 pr-11 text-base font-medium text-white shadow-inner placeholder:text-white/25 focus-visible:border-orange-400/40 focus-visible:ring-orange-500/25"
              />
              {entityA.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => setEntityA("")}
                  aria-label="Clear first option"
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile centered swap divider */}
          <div className="relative -my-1 flex items-center justify-center sm:hidden">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <button
              type="button"
              onClick={swapEntities}
              aria-label="Swap comparison options"
              disabled={!entityA.trim() && !entityB.trim()}
              className="relative inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#141210] px-3.5 py-1.5 text-[11px] font-semibold text-white/80 shadow-[0_4px_18px_rgba(0,0,0,.5)] backdrop-blur-md transition-all active:scale-95 hover:border-orange-300/30 hover:bg-[#1a1714] hover:text-orange-300 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowLeftRight className="h-3.5 w-3.5 rotate-90 text-orange-400" />
              <span>Swap</span>
            </button>
          </div>

          {/* Desktop swap button */}
          <button
            type="button"
            onClick={swapEntities}
            aria-label="Swap comparison options"
            disabled={!entityA.trim() && !entityB.trim()}
            className="hidden sm:grid sm:mb-1 sm:h-10 sm:w-10 sm:place-items-center sm:rounded-full sm:border sm:border-white/[0.08] sm:bg-white/[0.035] sm:text-white/65 sm:transition-colors hover:sm:border-orange-300/25 hover:sm:text-orange-300 disabled:sm:cursor-not-allowed disabled:sm:opacity-25"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>

          <div className="relative w-full">
            <label htmlFor="hero-comparison-input-b" className="mb-2 block px-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/65">
              Compare against
            </label>
            <div className="relative">
              <Input
                id="hero-comparison-input-b"
                type="text"
                aria-label="Second option"
                value={entityB}
                onChange={(e) => setEntityB(e.target.value)}
                placeholder="e.g. Google Pixel 9"
                autoComplete="off"
                className="h-14 rounded-xl border-white/[0.09] bg-black/50 pl-4 pr-11 text-base font-medium text-white shadow-inner placeholder:text-white/25 focus-visible:border-orange-400/40 focus-visible:ring-orange-500/25"
              />
              {entityB.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => setEntityB("")}
                  aria-label="Clear second option"
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Toggleable Context Field */}
        {showContextInput ? (
          <div className="space-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5 animate-in fade-in slide-in-from-top-1 duration-200 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-orange-300">Decision context</p>
                <p className="mt-1 text-[11px] text-white/60">Optional, but it sharpens scoring.</p>
              </div>
              <button type="button" onClick={() => { setContext(""); setShowContextInput(false); }} aria-label="Remove comparison context" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white/40 transition-colors hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <Input aria-label="Comparison context" type="text" value={context} onChange={(e) => setContext(e.target.value)} placeholder="Use case, budget, or top priority" className="h-12 rounded-xl border-white/[0.09] bg-black/50 text-base sm:text-sm text-white placeholder:text-white/25 focus-visible:ring-orange-500/25" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="composer-priorities" className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">
                  Priorities <span className="text-white/25">(optional)</span>
                </label>
                <Input id="composer-priorities" aria-label="What matters most" type="text" value={priorities} onChange={(e) => setPriorities(e.target.value)} placeholder="e.g. Price, then battery life" className="h-11 rounded-xl border-white/[0.09] bg-black/50 text-base sm:text-xs text-white placeholder:text-white/25 focus-visible:ring-orange-500/25" />
              </div>
              <div>
                <label htmlFor="composer-nonnegotiables" className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">
                  Non-negotiables <span className="text-white/25">(optional)</span>
                </label>
                <Input id="composer-nonnegotiables" aria-label="Hard requirements" type="text" value={nonNegotiables} onChange={(e) => setNonNegotiables(e.target.value)} placeholder="e.g. Under $800, available in my country" className="h-11 rounded-xl border-white/[0.09] bg-black/50 text-base sm:text-xs text-white placeholder:text-white/25 focus-visible:ring-orange-500/25" />
              </div>
            </div>
            <p className="text-[9px] leading-4 text-[#fdfbf7]/35">Priorities weight the scoring; non-negotiables are recorded verbatim in your brief. SideBy never invents requirements you didn't state.</p>
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">Quick templates</p>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar sm:flex-wrap">
                {COMPARISON_TEMPLATES.map((template) => {
                  const isSelected = context.trim().toLowerCase() === template.context.toLowerCase();
                  return (
                    <button key={template.label} type="button" onClick={() => setContext(template.context)} className={cn("min-h-10 shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95", isSelected ? "border-orange-500/50 bg-orange-500/10 text-orange-300 shadow-[0_0_12px_rgba(249,115,22,.15)]" : "border-white/[0.08] bg-black/30 text-white/70 hover:border-orange-500/30 hover:text-orange-300")}>{template.label}</button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row"><Input aria-label="Requirements URL" type="url" value={contextUrl} onChange={(event) => setContextUrl(event.target.value)} placeholder="Import requirements from a public URL" className="h-11 rounded-xl border-white/[0.09] bg-black/50 text-base sm:text-xs text-white placeholder:text-white/25" /><button type="button" onClick={() => void importUrlContext()} disabled={!contextUrl.trim() || isImportingUrl} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-orange-500/30 px-4 text-xs font-semibold text-orange-300 disabled:opacity-40 transition-colors hover:bg-orange-500/10"><Link2 className="h-3.5 w-3.5" />{isImportingUrl ? "Importing" : "Import URL"}</button></div>
            <p className="text-[9px] leading-4 text-[#fdfbf7]/35">Public URLs are imported and source-attributed automatically.</p>
          </div>
        ) : (
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setShowContextInput(true)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-1 text-[10px] font-bold uppercase tracking-widest text-orange-300/80 transition-colors hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              <Plus className="h-3 w-3" /> Add decision context
            </button>
          </div>
        )}

        {/* Validation / Preflight Feedback Banner */}
        {serializedQuery.trim().length > 0 && (
          <div aria-live="polite" className={cn(
            "rounded-lg border p-4 text-left text-xs leading-relaxed transition-all",
            isBlocked
              ? "border-red-500/20 bg-red-500/5 text-red-200/80"
              : isIncomplete
                ? "border-amber-500/20 bg-amber-500/5 text-amber-100/80"
              : queryIntent.canStart
                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-200/80"
                : "border-amber-500/20 bg-amber-500/5 text-amber-100/80"
          )}>
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-bold uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                {isValidating ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-orange-500" />
                    Checking Comparison Fit...
                  </>
                ) : isBlocked ? (
                  <>
                    <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                    Comparison Blocked
                  </>
                ) : isIncomplete ? (
                  <>One more option</>
                ) : (
                  <>
                    Brief ready — {Math.round(queryIntent.confidence * 100)}% fit
                  </>
                )}
              </span>

              {queryIntent.categoryLabel && !isValidating && !isIncomplete && (
                <Badge className="bg-[#1c1917] hover:bg-[#1c1917] border border-[#2e2a24] text-[#a8a29e] rounded-sm text-[9px] uppercase tracking-widest px-2 py-0.5 w-fit">
                  {queryIntent.categoryLabel}
                </Badge>
              )}
            </div>

            <p className="mt-2 text-[#fdfbf7]/75 font-sans leading-normal">
              {isValidating
                ? "Validating target options against category taxonomy..."
                : isIncomplete
                  ? "Enter both options to check whether they are a meaningful comparison."
                  : queryIntent.message}
            </p>

            {isBlocked && queryIntent.resolvedEntity && !isValidating && !isIncomplete && (
              <p className="mt-3 inline-flex items-center rounded-md border border-orange-500/20 bg-orange-500/[0.06] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-orange-200">
                Resolved identity: {queryIntent.resolvedEntity}
              </p>
            )}

            {/* Blocked or Warning Suggesion chip */}
            {queryIntent.suggestion && !isValidating && !isIncomplete && (
              <button
                type="button"
                onClick={() => handleSuggestionClick(queryIntent.suggestion!)}
                className="mt-3 text-left text-xs font-medium leading-5 text-orange-300 underline decoration-orange-500/20 underline-offset-4 transition-colors hover:text-orange-200"
              >
                {queryIntent.policyNote === "Duplicate entity"
                  ? "Compare distinct variants: "
                  : "Suggested formulation: "}
                {queryIntent.suggestion}
              </button>
            )}
          </div>
        )}

        {/* Submit Action Button */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={!canSubmit || isCreating || localSubmitting}
            className="group inline-flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-500 bg-[length:200%_100%] text-xs font-bold uppercase tracking-widest text-white shadow-[0_16px_42px_rgba(244,63,94,.2)] transition-all duration-500 hover:bg-[position:100%_0] hover:shadow-[0_18px_50px_rgba(249,115,22,.3)] active:scale-[0.99] disabled:cursor-not-allowed disabled:grayscale disabled:opacity-30"
          >
            {isCreating || localSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening research room...
              </>
            ) : (
              <>
                Research this decision
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Keyboard spacer: keeps the submit action reachable with the OS keyboard open */}
      <KeyboardSpacer />

      {/* Suggested chips list */}
      <div className="relative mt-5 border-t border-white/[0.07] pt-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#fdfbf7]/60 mb-3 text-left">
          Try an example
        </p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar sm:flex-wrap">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="min-h-10 shrink-0 rounded-full border border-white/[0.08] bg-black/30 px-3.5 py-1.5 text-xs font-medium text-white/80 transition-all active:scale-95 hover:border-orange-500/30 hover:bg-orange-500/5 hover:text-orange-300"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
