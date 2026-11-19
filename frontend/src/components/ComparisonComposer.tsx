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
} from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useComparisonValidation } from "@/hooks/useComparisonValidation";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { BorderBeam } from "@/components/ui/border-beam";
import { pwaUpdates } from "@/lib/pwa/register";
import { useDraftScope } from "@/hooks/useDraftScope";
import { KeyboardSpacer } from "@/components/KeyboardSpacer";
import { useI18n, type MessageKey, type TFunction } from "@/i18n";

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

// `context` is sent to the research engine, so it stays English; only the chip label is translated.
const COMPARISON_TEMPLATES: { label: MessageKey; context: string }[] = [
  { label: "composer.tpl.phones", context: "photography and daily use" },
  { label: "composer.tpl.cars", context: "daily commuting" },
  { label: "composer.tpl.ai", context: "an AI workflow" },
  { label: "composer.tpl.laptops", context: "software development" },
  { label: "composer.tpl.cities", context: "remote work" },
];

const POLICY_NOTE_TO_KEY: Record<string, MessageKey> = {
  "Food and drink": "validation.reason.food_drink",
  "Political subject": "validation.reason.political",
  "War or armed conflict": "validation.reason.war_conflict",
  "Personal attribute": "validation.reason.personal",
  "Religion comparison": "validation.reason.religion",
  "Protected-class comparison": "validation.reason.protected_class",
  "People comparison": "validation.reason.people",
  "Medical treatment": "validation.reason.medical",
  "Personalized finance": "validation.reason.personalized_finance",
  "Harmful technical request": "validation.reason.harmful_technical",
  "Duplicate entity": "validation.reason.same_entity",
};

const REASON_CODE_TO_KEY: Record<string, MessageKey> = {
  food_drink: "validation.reason.food_drink",
  political: "validation.reason.political",
  war_conflict: "validation.reason.war_conflict",
  personal: "validation.reason.personal",
  religion: "validation.reason.religion",
  protected_class: "validation.reason.protected_class",
  people: "validation.reason.people",
  medical: "validation.reason.medical",
  personalized_finance: "validation.reason.personalized_finance",
  harmful_technical: "validation.reason.harmful_technical",
  same_entity: "validation.reason.same_entity",
  too_short: "validation.reason.too_short",
  too_many_options: "validation.reason.too_many_options",
  recommendation_request: "validation.reason.recommendation_request",
  ai_busy: "validation.reason.ai_busy",
  unverified_frame: "validation.reason.unverified_frame",
};

const CATEGORY_TO_KEY: Record<string, MessageKey> = {
  software: "validation.category.software",
  developer_tool: "validation.category.developer_tool",
  ai_tool: "validation.category.ai_tool",
  product: "validation.category.product",
  company_service: "validation.category.company_service",
  place: "validation.category.place",
  education: "validation.category.education",
  career: "validation.category.career",
  finance_info: "validation.category.finance_info",
  health_fitness: "validation.category.health_fitness",
  method_framework: "validation.category.method_framework",
  technical_standard: "validation.category.technical_standard",
  politics_policy: "validation.category.politics_policy",
  general_research: "validation.category.general_research",
  unsupported: "validation.category.unsupported",
  sensitive: "validation.category.sensitive",
};

function localizeCategoryLabel(t: TFunction, category: string | null | undefined, fallback?: string): string | undefined {
  if (category && category in CATEGORY_TO_KEY) {
    return t(CATEGORY_TO_KEY[category]);
  }
  if (fallback === "Sensitive or personal subject") {
    return t("validation.category.sensitive");
  }
  return fallback;
}

function localizeIntentMessage(
  t: TFunction,
  lang: string,
  intent: {
    message: string;
    policyNote?: string;
    category?: string | null;
    entityA?: string | null;
    entityB?: string | null;
    resolvedEntity?: string;
    reasonCode?: string;
  },
): string {
  const code = intent.reasonCode;
  if (code && code in REASON_CODE_TO_KEY) {
    return t(REASON_CODE_TO_KEY[code]);
  }
  if (code === "technical_mismatch_recovered" && intent.entityA && intent.entityB) {
    const catLabel = localizeCategoryLabel(t, intent.category) ?? "";
    return t("validation.reason.ready_with_context", {
      entityA: intent.entityA,
      entityB: intent.entityB,
      category: catLabel.toLowerCase(),
    });
  }
  if ((code === "unrelated" || code === "similar_only" || code === "unsafe") && lang !== "en") {
    // Prefer AI's localized explanation when non-ASCII; otherwise use our localized fallback.
    if (!/[^\u0020-\u007E\r\n\t]/.test(intent.message)) {
      return t(`validation.reason.${code}` as MessageKey);
    }
    return intent.message;
  }

  if (intent.policyNote && intent.policyNote in POLICY_NOTE_TO_KEY) {
    return t(POLICY_NOTE_TO_KEY[intent.policyNote]);
  }
  if (intent.resolvedEntity) {
    return t("validation.reason.same_entity");
  }

  const msg = intent.message;
  if (msg === "This is too short to compare confidently.") return t("validation.reason.too_short");
  if (msg === "Compare exactly two options at a time.") return t("validation.reason.too_many_options");
  if (msg === "This sounds like a recommendation request. Pick two concrete options first.") {
    return t("validation.reason.recommendation_request");
  }
  if (msg === "SideBy will try to extract comparable options from your query.") {
    return t("validation.reason.extract_options");
  }
  if (msg.startsWith("Ready to compare ") && msg.includes('Add "for ..."') && intent.entityA && intent.entityB) {
    return t("validation.reason.ready_general", { entityA: intent.entityA, entityB: intent.entityB });
  }
  if (msg.startsWith("Ready to compare ") && intent.entityA && intent.entityB) {
    const catLabel = localizeCategoryLabel(t, intent.category) ?? "";
    return t("validation.reason.ready_with_context", {
      entityA: intent.entityA,
      entityB: intent.entityB,
      category: catLabel.toLowerCase(),
    });
  }
  if (msg.startsWith("Ready as ") && intent.category) {
    const catLabel = localizeCategoryLabel(t, intent.category) ?? "";
    return t("validation.reason.ready_no_context", { category: catLabel.toLowerCase() });
  }
  return msg;
}

function localizeSuggestionLabel(t: TFunction, suggestion: string): string {
  if (suggestion === "Try a source-backed product, software, place, education, career, finance concept, fitness concept, or method comparison.") {
    return t("validation.suggestion.default");
  }
  const match = suggestion.match(/^(.+) vs another option for your use case$/);
  if (match) {
    return t("validation.suggestion.withContext", { entityA: match[1] });
  }
  return suggestion;
}

export function ComparisonComposer({
  onStart,
  isCreating = false,
  initialQuery = "",
  className = "",
}: ComparisonComposerProps) {
  const { t, lang } = useI18n();
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
      toast.success(t("composer.importOk"), { description: t("composer.importGrounded", { title: data.source?.title || t("composer.importFallbackTitle") }) });
    } catch (error) {
      toast.error(t("composer.importFail"), { description: error instanceof Error ? error.message : t("composer.importTry") });
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
      toast.info(t("composer.restored"));
    }
  }, [isDraftScopeReady, draftScope, setEntityA, setEntityB, setContext, t]);

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

  const [swapRotation, setSwapRotation] = useState(0);

  const swapEntities = () => {
    setSwapRotation((prev) => prev + 180);
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
      <BorderBeam size={150} duration={12} colorFrom="#f97316" colorTo="#f43f5e" />
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-orange-500/[0.12] blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-fuchsia-500/[0.07] blur-[100px]" />
      <div className="relative mb-5 flex items-center justify-between gap-4 px-1">
        <div className="min-w-0 text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300">{t("composer.title")}</p>
          <p className="mt-1 text-xs text-white/65">{t("composer.subtitle")}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-widest text-emerald-300 sm:px-3 sm:text-[9px]">
          <Sparkles className="h-3 w-3" /> {t("composer.sourceBacked")}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-4">
        {/* Entity Inputs Row: on mobile, two full-width balanced inputs with a centered swap divider; on desktop, 3 columns */}
        <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-end sm:gap-x-2">
          <div className="relative w-full">
            <label htmlFor="hero-comparison-input" className="mb-2 block px-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/65">
              {t("composer.first")}
            </label>
            <div className="relative">
              <Input
                id="hero-comparison-input"
                aria-label={t("composer.firstAria")}
                type="text"
                value={entityA}
                onChange={(e) => setEntityA(e.target.value)}
                placeholder={t("composer.firstPlaceholder")}
                autoComplete="off"
                className="h-14 rounded-xl border-white/[0.09] bg-black/50 pl-4 pr-11 text-base font-medium text-white shadow-inner placeholder:text-white/25 focus-visible:border-orange-400/40 focus-visible:ring-orange-500/25"
              />
              {entityA.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => setEntityA("")}
                  aria-label={t("composer.clearFirst")}
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
            <motion.button
              type="button"
              onClick={swapEntities}
              aria-label={t("composer.swapAria")}
              disabled={!entityA.trim() && !entityB.trim()}
              whileTap={{ scale: 0.93 }}
              className="relative inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#141210] px-3.5 py-1.5 text-[11px] font-semibold text-white/80 shadow-[0_4px_18px_rgba(0,0,0,.5)] backdrop-blur-md transition-all hover:border-orange-300/30 hover:bg-[#1a1714] hover:text-orange-300 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <motion.span
                animate={{ rotate: swapRotation }}
                transition={{ type: "spring", stiffness: 350, damping: 20 }}
                className="inline-grid place-items-center"
              >
                <ArrowLeftRight className="h-3.5 w-3.5 rotate-90 text-orange-400" />
              </motion.span>
              <span>{t("composer.swap")}</span>
            </motion.button>
          </div>

          {/* Desktop swap button */}
          <motion.button
            type="button"
            onClick={swapEntities}
            aria-label={t("composer.swapAria")}
            disabled={!entityA.trim() && !entityB.trim()}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="hidden sm:grid sm:mb-1 sm:h-10 sm:w-10 sm:place-items-center sm:rounded-full sm:border sm:border-white/[0.08] sm:bg-white/[0.035] sm:text-white/65 sm:transition-colors hover:sm:border-orange-300/25 hover:sm:text-orange-300 disabled:sm:cursor-not-allowed disabled:sm:opacity-25"
          >
            <motion.span
              animate={{ rotate: swapRotation }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
              className="inline-grid place-items-center"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </motion.span>
          </motion.button>

          <div className="relative w-full">
            <label htmlFor="hero-comparison-input-b" className="mb-2 block px-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/65">
              {t("composer.second")}
            </label>
            <div className="relative">
              <Input
                id="hero-comparison-input-b"
                type="text"
                aria-label={t("composer.secondAria")}
                value={entityB}
                onChange={(e) => setEntityB(e.target.value)}
                placeholder={t("composer.secondPlaceholder")}
                autoComplete="off"
                className="h-14 rounded-xl border-white/[0.09] bg-black/50 pl-4 pr-11 text-base font-medium text-white shadow-inner placeholder:text-white/25 focus-visible:border-orange-400/40 focus-visible:ring-orange-500/25"
              />
              {entityB.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => setEntityB("")}
                  aria-label={t("composer.clearSecond")}
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
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-orange-300">{t("composer.context")}</p>
                <p className="mt-1 text-[11px] text-white/60">{t("composer.contextHint")}</p>
              </div>
              <button type="button" onClick={() => { setContext(""); setShowContextInput(false); }} aria-label={t("composer.contextRemove")} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white/40 transition-colors hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <Input aria-label={t("composer.contextAria")} type="text" value={context} onChange={(e) => setContext(e.target.value)} placeholder={t("composer.contextPlaceholder")} className="h-12 rounded-xl border-white/[0.09] bg-black/50 text-base sm:text-sm text-white placeholder:text-white/25 focus-visible:ring-orange-500/25" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="composer-priorities" className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">
                  {t("composer.priorities")} <span className="text-white/25">{t("composer.optional")}</span>
                </label>
                <Input id="composer-priorities" aria-label={t("composer.prioritiesAria")} type="text" value={priorities} onChange={(e) => setPriorities(e.target.value)} placeholder={t("composer.prioritiesPlaceholder")} className="h-11 rounded-xl border-white/[0.09] bg-black/50 text-base sm:text-xs text-white placeholder:text-white/25 focus-visible:ring-orange-500/25" />
              </div>
              <div>
                <label htmlFor="composer-nonnegotiables" className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">
                  {t("composer.nonNegotiables")} <span className="text-white/25">{t("composer.optional")}</span>
                </label>
                <Input id="composer-nonnegotiables" aria-label={t("composer.nonNegotiablesAria")} type="text" value={nonNegotiables} onChange={(e) => setNonNegotiables(e.target.value)} placeholder={t("composer.nonNegotiablesPlaceholder")} className="h-11 rounded-xl border-white/[0.09] bg-black/50 text-base sm:text-xs text-white placeholder:text-white/25 focus-visible:ring-orange-500/25" />
              </div>
            </div>
            <p className="text-[9px] leading-4 text-[#fdfbf7]/35">{t("composer.constraintsNote")}</p>
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">{t("composer.templates")}</p>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar sm:flex-wrap">
                {COMPARISON_TEMPLATES.map((template) => {
                  const isSelected = context.trim().toLowerCase() === template.context.toLowerCase();
                  return (
                    <button key={template.label} type="button" onClick={() => setContext(template.context)} className={cn("min-h-10 shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95", isSelected ? "border-orange-500/50 bg-orange-500/10 text-orange-300 shadow-[0_0_12px_rgba(249,115,22,.15)]" : "border-white/[0.08] bg-black/30 text-white/70 hover:border-orange-500/30 hover:text-orange-300")}>{t(template.label)}</button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row"><Input aria-label={t("composer.urlAria")} type="url" value={contextUrl} onChange={(event) => setContextUrl(event.target.value)} placeholder={t("composer.urlPlaceholder")} className="h-11 rounded-xl border-white/[0.09] bg-black/50 text-base sm:text-xs text-white placeholder:text-white/25" /><button type="button" onClick={() => void importUrlContext()} disabled={!contextUrl.trim() || isImportingUrl} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-orange-500/30 px-4 text-xs font-semibold text-orange-300 disabled:opacity-40 transition-colors hover:bg-orange-500/10"><Link2 className="h-3.5 w-3.5" />{isImportingUrl ? t("composer.importing") : t("composer.import")}</button></div>
            <p className="text-[9px] leading-4 text-[#fdfbf7]/35">{t("composer.urlNote")}</p>
          </div>
        ) : (
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setShowContextInput(true)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-1 text-[10px] font-bold uppercase tracking-widest text-orange-300/80 transition-colors hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              <Plus className="h-3 w-3" /> {t("composer.addContext")}
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
                    {t("composer.checking")}
                  </>
                ) : isBlocked ? (
                  <>
                    <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                    {t("composer.blocked")}
                  </>
                ) : isIncomplete ? (
                  <>{t("composer.oneMore")}</>
                ) : (
                  <>
                    {t("composer.ready", { percent: Math.round(queryIntent.confidence * 100) })}
                  </>
                )}
              </span>

              {queryIntent.categoryLabel && !isValidating && !isIncomplete && (
                <Badge className="bg-[#1c1917] hover:bg-[#1c1917] border border-[#2e2a24] text-[#a8a29e] rounded-sm text-[9px] uppercase tracking-widest px-2 py-0.5 w-fit">
                  {localizeCategoryLabel(t, queryIntent.category, queryIntent.categoryLabel)}
                </Badge>
              )}
            </div>

            <p className="mt-2 text-[#fdfbf7]/75 font-sans leading-normal">
              {isValidating
                ? t("composer.validating")
                : isIncomplete
                  ? t("composer.enterBoth")
                  : localizeIntentMessage(t, lang, queryIntent)}
            </p>

            {isBlocked && queryIntent.resolvedEntity && !isValidating && !isIncomplete && (
              <p className="mt-3 inline-flex items-center rounded-md border border-orange-500/20 bg-orange-500/[0.06] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-orange-200">
                {t("composer.resolved", { name: queryIntent.resolvedEntity })}
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
                  ? t("composer.distinct")
                  : t("composer.suggested")}
                {localizeSuggestionLabel(t, queryIntent.suggestion)}
              </button>
            )}
          </div>
        )}

        {/* Submit Action Button */}
        <div className="pt-1">
          <motion.button
            type="submit"
            disabled={!canSubmit || isCreating || localSubmitting}
            whileHover={!canSubmit || isCreating || localSubmitting ? undefined : { scale: 1.012, y: -1 }}
            whileTap={!canSubmit || isCreating || localSubmitting ? undefined : { scale: 0.985, y: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="group inline-flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-500 bg-[length:200%_100%] text-xs font-bold uppercase tracking-widest text-white shadow-[0_16px_42px_rgba(244,63,94,.2)] transition-all duration-500 hover:bg-[position:100%_0] hover:shadow-[0_18px_50px_rgba(249,115,22,.3)] disabled:cursor-not-allowed disabled:grayscale disabled:opacity-30"
          >
            {isCreating || localSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("composer.opening")}
              </>
            ) : (
              <>
                {t("composer.submit")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </motion.button>
        </div>
      </form>

      {/* Keyboard spacer: keeps the submit action reachable with the OS keyboard open */}
      <KeyboardSpacer />

      {/* Suggested chips list */}
      <div className="relative mt-5 border-t border-white/[0.07] pt-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#fdfbf7]/60 mb-3 text-left">
          {t("composer.examples")}
        </p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar sm:flex-wrap">
          {SUGGESTIONS.map((suggestion) => (
            <motion.button
              key={suggestion}
              type="button"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              onClick={() => handleSuggestionClick(suggestion)}
              className="min-h-10 shrink-0 rounded-full border border-white/[0.08] bg-black/30 px-3.5 py-1.5 text-xs font-medium text-white/80 transition-colors hover:border-orange-500/30 hover:bg-orange-500/5 hover:text-orange-300"
            >
              {suggestion}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
