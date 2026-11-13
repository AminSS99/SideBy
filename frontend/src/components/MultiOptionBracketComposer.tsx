import { useMemo, useState, useEffect, useRef } from "react";
import { GitCompareArrows, Loader2 } from "@/components/icons";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { pwaUpdates } from "@/lib/pwa/register";
import { useDraftScope } from "@/hooks/useDraftScope";

export type BracketRun = { id: string; query: string; status: "running" | "completed" | "failed" };

export function MultiOptionBracketComposer({
  onStart,
  isCreating,
}: {
  onStart: (options: string[], context: string) => Promise<BracketRun[]>;
  isCreating: boolean;
}) {
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
      toast.info("Restored your unsaved bracket options.");
    }
  }, [isDraftScopeReady, draftScope]);

  const start = async () => {
    if (options.length < 3) {
      toast.error("Add 3 or 4 distinct options.");
      return;
    }
    if (isCreating || isLocalStarting) return;

    setIsLocalStarting(true);
    try {
      const nextRuns = await onStart(options, context);
      setRuns(nextRuns);
      toast.success("Bracket research started.", { description: `${nextRuns.length} evidence-backed pair comparisons are running.` });
    } catch (error) {
      toast.error("Unable to start the bracket.", { description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setTimeout(() => setIsLocalStarting(false), 600);
    }
  };

  return (
    <section className="rounded-xl border border-white/[0.08] bg-[#111]/90 p-5 backdrop-blur-sm transition-all hover:border-orange-500/20">
      <div className="flex items-start gap-3">
        <GitCompareArrows className="mt-0.5 h-5 w-5 text-orange-400 shrink-0" />
        <div>
          <h2 className="font-serif text-xl text-white">3–4 option bracket</h2>
          <p className="mt-1 text-xs leading-relaxed text-white/50">
            SideBy creates every pairwise research run, so each matchup keeps its sources, confidence, and verdict.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <div>
          <label htmlFor="bracket-options" className="mb-1.5 block text-[9px] font-bold uppercase tracking-widest text-white/40">
            Options (3–4, one per line)
          </label>
          <textarea
            id="bracket-options"
            value={rawOptions}
            onChange={(event) => setRawOptions(event.target.value)}
            maxLength={320}
            placeholder={"Supabase\nFirebase\nAppwrite"}
            className="min-h-20 w-full rounded-lg border border-white/[0.1] bg-[#0c0b0a] p-3 text-base md:text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-500 transition-colors"
          />
        </div>
        <div className="md:self-center">
          <label htmlFor="bracket-context" className="mb-1.5 block text-[9px] font-bold uppercase tracking-widest text-white/40">
            Shared context <span className="text-white/25">(optional)</span>
          </label>
          <input
            id="bracket-context"
            value={context}
            onChange={(event) => setContext(event.target.value)}
            maxLength={200}
            placeholder="Optional shared use case"
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
          {isCreating || isLocalStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Research ${pairCount} pairs`}
        </motion.button>
      </div>
      <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-white/35">
        {options.length}/4 options · {pairCount || 0} pairwise research runs
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
                  <th className="px-3 py-2">Matchup</th>
                  <th className="px-3 py-2">Research status</th>
                  <th className="px-3 py-2">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-t border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                    <td className="px-3 py-3 text-white/80 font-medium">{run.query}</td>
                    <td className="px-3 py-3 capitalize text-orange-300">{run.status}</td>
                    <td className="px-3 py-3">
                      <a href={`/app/comparisons/${run.id}`} className="font-bold uppercase tracking-widest text-orange-400 hover:text-orange-300">
                        Open
                      </a>
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
