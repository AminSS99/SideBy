import React, { useState } from "react";
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

interface ComparisonComposerProps {
  onStart: (query: string) => void | Promise<void>;
  isCreating?: boolean;
  initialQuery?: string;
  className?: string;
}

const SUGGESTIONS = [
  "Supabase vs Firebase for real-time applications",
  "React vs Vue for SaaS products",
  "Cursor vs Windsurf for AI coding",
  "Vercel vs Render for deployment",
  "Notion vs Linear for project management",
];

const COMPARISON_TEMPLATES = [
  { label: "BaaS", context: "a production BaaS" },
  { label: "Hosting", context: "hosting a web application" },
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serializedQuery.trim() || isBlocked || isValidating) return;
    void onStart(serializedQuery);
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
    entityB.trim().length > 0;

  return (
    <div className={cn("relative w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-white/[0.12] bg-[#0d0b0a]/92 p-4 shadow-[0_30px_100px_rgba(0,0,0,.55),0_0_80px_rgba(249,115,22,.08)] backdrop-blur-2xl sm:p-6", className)}>
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-orange-500/[0.12] blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-fuchsia-500/[0.07] blur-[100px]" />
      <div className="relative mb-5 flex items-center justify-between gap-4 px-1">
        <div className="text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300">Build your comparison</p>
          <p className="mt-1 text-xs text-white/45">Two options in. A defensible answer out.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-widest text-emerald-300 sm:px-3 sm:text-[9px]">
          <Sparkles className="h-3 w-3" /> Source backed
        </span>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-4">
        {/* Entity Inputs Row */}
        <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-2.5 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <div className="relative col-span-2 w-full sm:col-span-1">
            <label htmlFor="hero-comparison-input" className="mb-2 block px-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/45">
              First option
            </label>
            <Input
              id="hero-comparison-input"
              aria-label="First option"
              type="text"
              value={entityA}
              onChange={(e) => setEntityA(e.target.value)}
              placeholder="e.g. Supabase"
              autoComplete="off"
              className="h-14 rounded-xl border-white/[0.09] bg-black/50 px-4 text-base font-medium text-white shadow-inner placeholder:text-white/25 focus-visible:border-orange-400/40 focus-visible:ring-orange-500/25"
            />
          </div>

          <button
            type="button"
            onClick={swapEntities}
            aria-label="Swap comparison options"
            disabled={!entityA.trim() && !entityB.trim()}
            className="order-3 grid h-12 w-12 place-items-center self-end rounded-xl border border-white/[0.08] bg-white/[0.035] text-white/45 transition-colors hover:border-orange-300/25 hover:text-orange-300 disabled:cursor-not-allowed disabled:opacity-25 sm:order-none sm:mb-1 sm:h-10 sm:w-10 sm:rounded-full"
          >
            <ArrowLeftRight className="h-4 w-4 rotate-90 sm:rotate-0" />
          </button>

          <div className="relative order-2 w-full sm:order-none">
            <label htmlFor="hero-comparison-input-b" className="mb-2 block px-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/45">
              Compare against
            </label>
            <Input
              id="hero-comparison-input-b"
              type="text"
              aria-label="Second option"
              value={entityB}
              onChange={(e) => setEntityB(e.target.value)}
              placeholder="e.g. Firebase"
              autoComplete="off"
              className="h-14 rounded-xl border-white/[0.09] bg-black/50 px-4 text-base font-medium text-white shadow-inner placeholder:text-white/25 focus-visible:border-orange-400/40 focus-visible:ring-orange-500/25"
            />
          </div>
        </div>

        {/* Toggleable Context Field */}
        {showContextInput ? (
          <div className="space-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5 animate-in fade-in slide-in-from-top-1 duration-200 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-orange-300">Decision context</p>
                <p className="mt-1 text-[10px] text-white/35">Optional, but it sharpens scoring.</p>
              </div>
              <button type="button" onClick={() => { setContext(""); setShowContextInput(false); }} aria-label="Remove comparison context" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white/40 transition-colors hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <Input aria-label="Comparison context" type="text" value={context} onChange={(e) => setContext(e.target.value)} placeholder="Use case, budget, or top priority" className="h-12 rounded-xl border-white/[0.09] bg-black/50 text-white placeholder:text-white/25 focus-visible:ring-orange-500/25" />
            <div>
              <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.18em] text-white/35">Quick templates</p>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar sm:flex-wrap">
                {COMPARISON_TEMPLATES.map((template) => {
                  const isSelected = context.trim().toLowerCase() === template.context.toLowerCase();
                  return (
                    <button key={template.label} type="button" onClick={() => setContext(template.context)} className={cn("min-h-9 shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors", isSelected ? "border-orange-500/50 bg-orange-500/10 text-orange-300" : "border-white/[0.08] bg-black/30 text-white/50 hover:border-orange-500/30 hover:text-orange-300")}>{template.label}</button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row"><Input aria-label="Requirements URL" type="url" value={contextUrl} onChange={(event) => setContextUrl(event.target.value)} placeholder="Import requirements from a public URL" className="h-11 rounded-xl border-white/[0.09] bg-black/50 text-xs text-white placeholder:text-white/25" /><button type="button" onClick={() => void importUrlContext()} disabled={!contextUrl.trim() || isImportingUrl} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-orange-500/30 px-4 text-[9px] font-bold uppercase tracking-widest text-orange-300 disabled:opacity-40"><Link2 className="h-3 w-3" />{isImportingUrl ? "Importing" : "Import URL"}</button></div>
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
            disabled={!canSubmit || isCreating}
            className="group inline-flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-500 bg-[length:200%_100%] text-xs font-bold uppercase tracking-widest text-white shadow-[0_16px_42px_rgba(244,63,94,.2)] transition-all duration-500 hover:bg-[position:100%_0] hover:shadow-[0_18px_50px_rgba(249,115,22,.3)] active:scale-[0.99] disabled:cursor-not-allowed disabled:grayscale disabled:opacity-30"
          >
            {isCreating ? (
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

      {/* Suggested chips list */}
      <div className="relative mt-5 border-t border-white/[0.07] pt-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#fdfbf7]/60 mb-3 text-left">
          Try a proven question
        </p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar sm:flex-wrap">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="min-h-9 shrink-0 rounded-full border border-white/[0.08] bg-black/30 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-white/60 transition-all hover:border-orange-500/30 hover:bg-orange-500/5 hover:text-orange-300"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
