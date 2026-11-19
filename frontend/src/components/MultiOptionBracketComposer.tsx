import { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { GitCompareArrows, Loader2 } from "@/components/icons";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { pwaUpdates } from "@/lib/pwa/register";
import { useDraftScope } from "@/hooks/useDraftScope";
import { useT } from "@/i18n";

export type BracketRun = { id: string; query: string; status: "running" | "completed" | "failed" };

export function MultiOptionBracketComposer({
  onStart,
  isCreating,
}: {
  onStart: (options: string[], context: string) => Promise<BracketRun[]>;
  isCreating: boolean;
}) {
  const t = useT();
  const [rawOptions, setRawOptions] = useState("");
  const [context, setContext] = useState("");
  const [runs, setRuns] = useState<BracketRun[]>([]);
  const [isLocalStarting, setIsLocalStarting] = useState(false);
  const options = useMemo(() => [...new Set(rawOptions.split(/[\n,]/).map((item) => item.trim()).filter(Boolean))].slice(0, 4), [rawOptions]);
  const pairCount = (options.length * (options.length - 1)) / 2;

  const { scope: draftScope, isReady: isDraftScopeReady } = useDraftScope();
  const restoreAttemptedForScope = useRef<string | null>(null);

  useEffect(() => {
    const unregisterChecker = pwaUpdates.registerDirtyChecker(() => Boolean(rawOptions.trim() || context.trim()));
    const unregisterSaver = pwaUpdates.registerDraftSaver(() => {
      if (!rawOptions.trim() && !context.trim()) return null;
      if (!draftScope) return null;
      return { key: "bracket_composer", data: { rawOptions, context }, scope: draftScope };
    });
    return () => {
      unregisterChecker();
      unregisterSaver();
    };
  }, [rawOptions, context, draftScope]);

  useEffect(() => {
    if (!isDraftScopeReady || !draftScope) return;
    const scopeKey = JSON.stringify(draftScope);
    if (restoreAttemptedForScope.current === scopeKey) return;
    restoreAttemptedForScope.current = scopeKey;
    const draft = pwaUpdates.getPreservedDraft<{ rawOptions?: string; context?: string }>("bracket_composer", draftScope);
    if (draft && (draft.rawOptions || draft.context)) {
      if (draft.rawOptions) setRawOptions(draft.rawOptions);
      if (draft.context) setContext(draft.context);
      pwaUpdates.clearPreservedDraft("bracket_composer");
      toast.info(t("bracket.restoredDraft"));
    }
  }, [isDraftScopeReady, draftScope, t]);

  const start = async () => {
    if (options.length < 3) {
      toast.error(t("bracket.needThreeOptions"));
      return;
    }
    if (isCreating || isLocalStarting) return;

    setIsLocalStarting(true);
    try {
      const nextRuns = await onStart(options, context);
      setRuns(nextRuns);
      toast.success(t("bracket.startedTitle"), { description: t("bracket.startedDesc", { count: nextRuns.length }) });
    } catch (error) {
      toast.error(t("bracket.startErrorTitle"), { description: error instanceof Error ? error.message : t("bracket.startErrorFallback") });
    } finally {
      setTimeout(() => setIsLocalStarting(false), 600);
    }
  };

  return (
    <section className="rounded-xl border border-white/[0.08] bg-[#111]/90 p-5 backdrop-blur-sm transition-all hover:border-orange-500/20">
      <div className="flex items-start gap-3">
        <GitCompareArrows className="mt-0.5 h-5 w-5 text-orange-400 shrink-0" />
        <div>
          <h2 className="font-serif text-xl text-white">{t("bracket.title")}</h2>
          <p className="mt-1 text-xs leading-relaxed text-white/50">
            {t("bracket.subtitle")}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <div>
          <label htmlFor="bracket-options" className="mb-1.5 block text-[9px] font-bold uppercase tracking-widest text-white/40">
            {t("bracket.optionsLabel")}
          </label>
          <textarea
            id="bracket-options"
            value={rawOptions}
            onChange={(event) => setRawOptions(event.target.value)}
            maxLength={320}
            placeholder={t("bracket.optionsPlaceholder")}
            className="min-h-20 w-full rounded-lg border border-white/[0.1] bg-[#0c0b0a] p-3 text-base md:text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-500 transition-colors"
          />
        </div>
        <div className="md:self-center">
          <label htmlFor="bracket-context" className="mb-1.5 block text-[9px] font-bold uppercase tracking-widest text-white/40">
            {t("bracket.contextLabel")} <span className="text-white/25">{t("bracket.optional")}</span>
          </label>
          <input
            id="bracket-context"
            value={context}
            onChange={(event) => setContext(event.target.value)}
            maxLength={200}
            placeholder={t("bracket.contextPlaceholder")}
            className="h-11 w-full rounded-lg border border-white/[0.1] bg-[#0c0b0a] px-3 text-base md:text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-500 transition-colors"
          />
        </div>
        <motion.button
          type="button"
          whileHover={!isCreating && !isLocalStarting && options.length >= 3 ? { scale: 1.02 } : undefined}
          whileTap={!isCreating && !isLocalStarting && options.length >= 3 ? { scale: 0.97 } : undefined}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={() => void start()}
          disabled={isCreating || isLocalStarting || options.length < 3}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-orange-500 px-5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-400 disabled:opacity-40 md:self-end focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
        >
          {isCreating || isLocalStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("bracket.researchPairs", { count: pairCount })}
        </motion.button>
      </div>
      <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-white/35">
        {t("bracket.summary", { options: options.length, pairs: pairCount || 0 })}
      </p>
      <AnimatePresence>
        {runs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="mt-4 overflow-x-auto rounded-lg border border-white/[0.08]"
          >
            <table className="w-full min-w-[460px] text-left text-xs">
              <thead className="bg-[#0c0b0a] text-[9px] uppercase tracking-widest text-white/40">
                <tr>
                  <th className="px-3 py-2">{t("bracket.colMatchup")}</th>
                  <th className="px-3 py-2">{t("bracket.colStatus")}</th>
                  <th className="px-3 py-2">{t("bracket.colEvidence")}</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-t border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                    <td className="px-3 py-3 text-white/80 font-medium">{run.query}</td>
                    <td className="px-3 py-3 capitalize text-orange-300">{t(`bracket.status.${run.status}`)}</td>
                    <td className="px-3 py-3">
                      <Link to={`/app/comparisons/${run.id}`} className="font-bold uppercase tracking-widest text-orange-400 hover:text-orange-300">
                        {t("bracket.open")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
