import React, { useState } from "react";
import { Sparkles, Plus, ArrowRight, Loader2, ShieldAlert, X, Link2 } from "lucide-react";
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

  const canSubmit =
    serializedQuery.trim().length > 0 &&
    !isBlocked &&
    !isValidating &&
    entityA.trim().length > 0 &&
    entityB.trim().length > 0;

  return (
    <div className={cn("w-full max-w-2xl bg-[#0c0b0a] border border-[#2a2a2a] rounded-xl p-6 shadow-2xl relative overflow-hidden", className)}>
      {/* Background glow card style */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/[0.03] blur-[60px] rounded-full pointer-events-none" />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Entity Inputs Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full relative">
            <Input
              id="hero-comparison-input"
              type="text"
              value={entityA}
              onChange={(e) => setEntityA(e.target.value)}
              placeholder="Product or framework A (e.g. Supabase)"
              className="h-12 bg-black border-[#222] focus-visible:ring-orange-500/50 text-white placeholder:text-[#ffffff20] rounded-lg pl-3 font-medium transition-all"
            />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60 select-none">
            vs
          </span>

          <div className="w-full relative">
            <Input
              type="text"
              value={entityB}
              onChange={(e) => setEntityB(e.target.value)}
              placeholder="Product or framework B (e.g. Firebase)"
              className="h-12 bg-black border-[#222] focus-visible:ring-orange-500/50 text-white placeholder:text-[#ffffff20] rounded-lg pl-3 font-medium transition-all"
            />
          </div>
        </div>

        {/* Toggleable Context Field */}
        {showContextInput ? (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2"><Input type="text" value={context} onChange={(e) => setContext(e.target.value)} placeholder="Context or Use Case (optional, e.g. for real-time SaaS)" className="h-11 bg-black border-[#222] focus-visible:ring-orange-500/50 text-white placeholder:text-[#ffffff20] rounded-lg font-medium transition-all" /><button type="button" onClick={() => { setContext(""); setShowContextInput(false); }} aria-label="Remove comparison context" className="p-2 bg-transparent text-[#fdfbf7]/40 hover:text-white transition-colors"><X className="h-4 w-4" /></button></div>
            <div className="flex gap-2"><Input type="url" value={contextUrl} onChange={(event) => setContextUrl(event.target.value)} placeholder="Import requirements from a public URL" className="h-9 bg-black border-[#222] text-xs text-white placeholder:text-[#ffffff20]" /><button type="button" onClick={() => void importUrlContext()} disabled={!contextUrl.trim() || isImportingUrl} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-orange-500/30 px-3 text-[9px] font-bold uppercase tracking-widest text-orange-300 disabled:opacity-40"><Link2 className="h-3 w-3" />{isImportingUrl ? "Importing" : "Import URL"}</button></div>
            <p className="text-[9px] text-[#fdfbf7]/40">For PDFs, upload them in Knowledge and paste the requirements here; public URLs are imported and source-attributed automatically.</p>
          </div>
        ) : (
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setShowContextInput(true)}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-orange-500/80 hover:text-orange-400 transition-colors py-1 focus:outline-none"
            >
              <Plus className="h-3 w-3" /> Add Context
            </button>
          </div>
        )}

        <div className="border-t border-[#1f1f1f] pt-4">
          <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#fdfbf7]/55">
            Comparison template
          </p>
          <div className="flex flex-wrap gap-2">
            {COMPARISON_TEMPLATES.map((template) => {
              const isSelected = context.trim().toLowerCase() === template.context.toLowerCase();
              return (
                <button
                  key={template.label}
                  type="button"
                  onClick={() => {
                    setContext(template.context);
                    setShowContextInput(true);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors",
                    isSelected
                      ? "border-orange-500/50 bg-orange-500/10 text-orange-300"
                      : "border-[#2a2a2a] bg-black/40 text-[#fdfbf7]/60 hover:border-orange-500/30 hover:text-orange-300",
                  )}
                >
                  {template.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Validation / Preflight Feedback Banner */}
        {serializedQuery.trim().length > 0 && (
          <div className={cn(
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
                  <>Complete the pair</>
                ) : (
                  <>
                    Comparison Fit — {Math.round(queryIntent.confidence * 100)}%
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
                className="mt-3 text-[10px] font-bold uppercase tracking-widest text-orange-400 hover:text-orange-300 underline decoration-orange-500/20 underline-offset-4 transition-colors"
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
        <div className="pt-2">
          <button
            type="submit"
            disabled={!canSubmit || isCreating}
            className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-lg bg-[#fdfbf7] text-[#0c0b0a] hover:bg-[#e2e2e2] disabled:opacity-30 disabled:cursor-not-allowed font-bold uppercase tracking-widest text-xs transition-all active:scale-[0.99]"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Initiating Research...
              </>
            ) : (
              <>
                Compare Options
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggested chips list */}
      <div className="mt-6 border-t border-[#1f1f1f] pt-5">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#fdfbf7]/60 mb-3 text-left">
          Suggested comparisons
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/70 hover:text-orange-400 bg-black/40 hover:bg-orange-500/5 border border-[#1f1f1f] hover:border-orange-500/30 rounded-full px-3 py-1.5 transition-all"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
