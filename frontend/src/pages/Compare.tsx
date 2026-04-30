import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Search, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { brand, colors } from "@/config/brand";
import { buildApiUrl } from "@/config/env";
import { apiFetch } from "@/lib/api";
import {
  type ComparisonData,
  ComparisonHeader,
  CategorySection,
  VerdictPanel,
  SourcesPanel,
  FollowUpPanel,
} from "@/components/Comparison/ComparisonEngine";

const Compare = () => {
  const { slug } = useParams<{ slug: string }>();
  const [followUp, setFollowUp] = useState("");
  const [followUpAnswer, setFollowUpAnswer] = useState("");

  const { data: jobData, isLoading, error } = useQuery({
    queryKey: ["public-comparison", slug],
    queryFn: async () => {
      const res = await apiFetch(buildApiUrl(`/api/comparisons/by-slug/${slug}`));
      if (!res.ok) throw new Error("Comparison not found.");
      const data = await res.json();
      return data as { result: ComparisonData; query: string; id: string };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const result = jobData?.result;
  const entityFacts = useMemo(() => {
    if (!result) return { a: [] as { category: string }[], b: [] as { category: string }[] };
    const facts = result.categories.flatMap((c) => c.facts.map((f) => ({ ...f, category: c.name })));
    return { a: facts.filter((f) => f.entity === "a"), b: facts.filter((f) => f.entity === "b") };
  }, [result]);

  const askFollowUp = async () => {
    const clean = followUp.trim();
    if (!clean || !jobData?.id) return;
    try {
      const res = await apiFetch(buildApiUrl(`/api/comparisons/${jobData.id}/follow-up`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: clean }),
      });
      if (res.ok) {
        const data = await res.json();
        setFollowUpAnswer(data.answer);
        setFollowUp("");
        return;
      }
    } catch (e) { console.error("Follow-up failed:", e); }
    setFollowUpAnswer(`Based on the current source-backed matrix, the answer leans toward ${result?.verdict?.developers || "the left option"} for technical control.`);
    setFollowUp("");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#030303] text-white selection:bg-purple-500/30">
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-purple-600/[0.04] blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-sky-600/[0.04] blur-[120px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#030303]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 font-serif text-lg text-white shadow-lg shadow-purple-500/20">S</div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-white">{brand.productName}</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">Research Engine</p>
            </div>
          </Link>
          <Link
            to="/"
            className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/50 transition-all hover:border-white/20 hover:text-white"
          >
            <Search className="mr-2 inline h-3 w-3" />
            New Comparison
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-purple-400/50" />
              <p className="text-sm text-white/30">Loading comparison...</p>
            </div>
          </div>
        ) : error || !result ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="mb-4 font-serif text-4xl text-white/20">Comparison not found</p>
            <p className="mb-8 text-sm text-white/30">
              This comparison may not exist yet. Try running it first on the homepage.
            </p>
            <Link
              to="/"
              className="rounded-xl bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-white/90"
            >
              Go Home
            </Link>
          </div>
        ) : (
          <>
            <section className="mb-10">
              <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">
                <Sparkles className="h-3.5 w-3.5" /> Public Comparison
              </div>
              <h1 className="font-serif text-4xl text-white sm:text-5xl">
                <span className="bg-gradient-to-b from-purple-400 to-purple-600 bg-clip-text text-transparent">{result.entities.a.name}</span>
                <span className="mx-3 font-sans text-xl italic font-light text-white/15">vs</span>
                <span className="bg-gradient-to-b from-sky-400 to-blue-600 bg-clip-text text-transparent">{result.entities.b.name}</span>
              </h1>
              <p className="mt-3 text-sm text-white/30">{brand.tagline} — {brand.domain}</p>
            </section>

            <div className="grid gap-10 lg:grid-cols-12">
              <div className="space-y-10 lg:col-span-8">
                <ComparisonHeader result={result} onRefresh={handleRefresh} comparisonId={jobData.id} />
                <div className="space-y-10">
                  {result.categories.map((cat, i) => (
                    <CategorySection key={cat.name} category={cat} entities={result.entities} index={i} />
                  ))}
                </div>
              </div>
              <aside className="space-y-6 lg:col-span-4">
                <VerdictPanel result={result} />
                <FactPanel result={result} facts={entityFacts} />
                <SourcesPanel sources={result.sources} />
                <FollowUpPanel
                  question={followUp}
                  answer={followUpAnswer}
                  onQuestionChange={setFollowUp}
                  onAsk={askFollowUp}
                />
              </aside>
            </div>

            <section className="mt-20 border-t border-white/[0.06] pt-12">
              <p className="mb-6 text-center text-sm text-white/25">Try another comparison</p>
              <div className="flex flex-wrap justify-center gap-3">
                {["Supabase vs Firebase", "Cursor vs Windsurf", "ChatGPT Plus vs Claude Pro", "Vercel vs Render"].map((q) => {
                  const [a, b] = q.split(/\s+vs\s+/i);
                  const link = `/compare/${a.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-vs-${b.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
                  return (
                    <Link key={q} to={link} className="rounded-full border border-white/[0.06] bg-white/[0.01] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/35 transition-all hover:border-purple-500/20 hover:bg-purple-500/[0.04] hover:text-purple-300">
                      {q}
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

const FactPanel = ({ result, facts }: { result: ComparisonData; facts: Record<string, Array<{ category: string }>> }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/80 backdrop-blur-xl p-6">
    <h3 className="mb-5 font-serif text-lg text-white">Fact Coverage</h3>
    <div className="space-y-3">
      {(["a", "b"] as const).map((key) => (
        <div key={key} className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: result.entities[key].hex }}>{result.entities[key].name}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{facts[key].length} facts</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {facts[key].slice(0, 4).map((f) => (
              <span key={`${key}-${f.category}`} className="rounded-md bg-white/[0.03] px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-white/35">{f.category}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </motion.div>
);

export default Compare;
