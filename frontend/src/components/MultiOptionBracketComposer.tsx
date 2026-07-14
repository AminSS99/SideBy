import { useMemo, useState } from "react";
import { GitCompareArrows, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  const options = useMemo(() => [...new Set(rawOptions.split(/[\n,]/).map((item) => item.trim()).filter(Boolean))].slice(0, 4), [rawOptions]);
  const pairCount = (options.length * (options.length - 1)) / 2;

  const start = async () => {
    if (options.length < 3) {
      toast.error("Add 3 or 4 distinct options.");
      return;
    }
    try {
      const nextRuns = await onStart(options, context);
      setRuns(nextRuns);
      toast.success("Bracket research started.", { description: `${nextRuns.length} evidence-backed pair comparisons are running.` });
    } catch (error) {
      toast.error("Unable to start the bracket.", { description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  return <section className="rounded-sm border border-[#2a2a2a] bg-[#111] p-5">
    <div className="flex items-start gap-3"><GitCompareArrows className="mt-0.5 h-5 w-5 text-orange-400" /><div><h2 className="font-serif text-xl text-white">3–4 option bracket</h2><p className="mt-1 text-xs leading-relaxed text-white/50">SideBy creates every pairwise research run, so each matchup keeps its sources, confidence, and verdict.</p></div></div>
    <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
      <textarea value={rawOptions} onChange={(event) => setRawOptions(event.target.value)} maxLength={320} placeholder={"Supabase\nFirebase\nAppwrite"} className="min-h-20 rounded-sm border border-[#333] bg-[#0c0b0a] p-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-500" />
      <input value={context} onChange={(event) => setContext(event.target.value)} maxLength={200} placeholder="Optional shared use case" className="h-10 rounded-sm border border-[#333] bg-[#0c0b0a] px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-500 md:self-center" />
      <button type="button" onClick={() => void start()} disabled={isCreating || options.length < 3} className="h-10 rounded-sm bg-orange-500 px-4 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-orange-400 disabled:opacity-40 md:self-center">{isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : `Research ${pairCount} pairs`}</button>
    </div>
    <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-white/35">{options.length}/4 options · {pairCount || 0} pairwise research runs</p>
    {runs.length > 0 && <div className="mt-4 overflow-x-auto rounded-sm border border-[#2a2a2a]"><table className="w-full min-w-[460px] text-left text-xs"><thead className="bg-[#0c0b0a] text-[9px] uppercase tracking-widest text-white/40"><tr><th className="px-3 py-2">Matchup</th><th className="px-3 py-2">Research status</th><th className="px-3 py-2">Evidence</th></tr></thead><tbody>{runs.map((run) => <tr key={run.id} className="border-t border-[#2a2a2a]"><td className="px-3 py-3 text-white/80">{run.query}</td><td className="px-3 py-3 capitalize text-orange-300">{run.status}</td><td className="px-3 py-3"><a href={`/app/comparisons/${run.id}`} className="font-bold uppercase tracking-widest text-orange-400 hover:text-orange-300">Open</a></td></tr>)}</tbody></table></div>}
  </section>;
}
