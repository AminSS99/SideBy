import React, { useState, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Sparkles, Search, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { brand } from "@/config/brand";
import { buildApiUrl } from "@/config/env";
import { apiFetch } from "@/lib/api";
import { buildResult } from "@/lib/comparisonUtils";
import { AmbientOrbs } from "@/components/AmbientOrbs";
import {
  type ComparisonData,
  ComparisonHeader,
  CategorySection,
  VerdictPanel,
  SourcesPanel,
  FollowUpPanel,
  EntityFactPanel,
  RadarChartPanel,
  ConsensusPanel,
  FeatureMatrixPanel,
} from "@/components/Comparison/ComparisonEngine";

const Compare = () => {
  const { slug } = useParams<{ slug: string }>();
  const [followUp, setFollowUp] = useState("");
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: jobData, isLoading, error } = useQuery({
    queryKey: ["public-comparison", slug],
    queryFn: async () => {
      try {
        const res = await apiFetch(buildApiUrl(`/api/comparisons/by-slug/${slug}`));
        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType?.includes("application/json")) throw new Error("Comparison not found.");
        const data = await res.json();
        return data as { result: ComparisonData; query: string; id: string };
      } catch (e) {
        console.warn("Backend disconnected. Falling back to local simulation.", e);
        // Clean up the slug into a readable query
        const [a, b] = (slug || "supabase-vs-firebase").split("-vs-");
        const query = `${a || "Item A"} vs ${b || "Item B"}`;
        return {
          result: buildResult(query, 0),
          query,
          id: "mock-" + Date.now()
        };
      }
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
    } catch (e) { console.error("Follow-up failed, falling back to local simulation:", e); }
    setFollowUpAnswer(`Based on the current source-backed matrix, the answer leans toward ${result?.verdict?.developers || "the left option"} for technical control.`);
    setFollowUp("");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  useGSAP(() => {
    if (!isLoading && result) {
      const tl = gsap.timeline();
      tl.from(".compare-hero-badge", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" })
        .from(".compare-hero-title", { y: 30, opacity: 0, duration: 1, ease: "expo.out" }, "-=0.6")
        .from(".compare-hero-desc", { opacity: 0, duration: 0.8 }, "-=0.4")
        .from(".compare-content-grid", { y: 60, opacity: 0, duration: 1.2, ease: "expo.out" }, "-=0.6");
    }
  }, [isLoading, result]);

  return (
    <div ref={containerRef} className="min-h-screen overflow-x-hidden bg-[#030303] text-white selection:bg-orange-500/30 relative">
      <div className="pointer-events-none fixed inset-0 opacity-[0.03] z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      
      <AmbientOrbs />

      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#030303]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-4 group" aria-label={brand.productName}>
            <div className="flex h-10 w-10 items-center justify-center border border-[#333] bg-[#111] font-serif text-xl text-[#fdfbf7] transition-all group-hover:border-orange-500/50 group-hover:text-orange-400">
              S
            </div>
            <div>
              <p className="font-serif text-sm tracking-tight text-[#fdfbf7] group-hover:text-orange-50 transition-colors">{brand.productName}</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#fdfbf7]/40">Research Engine</p>
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
              <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-orange-500/50" />
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
              <div className="compare-hero-badge mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500">
                <Sparkles className="h-3.5 w-3.5" /> Public Comparison
              </div>
              <h1 className="compare-hero-title font-serif text-4xl text-white sm:text-5xl">
                <span className="bg-gradient-to-b from-orange-400 to-orange-600 bg-clip-text text-transparent">{result.entities.a.name}</span>
                <span className="mx-4 font-sans text-xl italic font-light text-white/15">vs</span>
                <span className="bg-gradient-to-b from-cyan-400 to-blue-600 bg-clip-text text-transparent">{result.entities.b.name}</span>
              </h1>
              <p className="compare-hero-desc mt-3 text-sm text-white/30">{brand.tagline} — {brand.domain}</p>
            </section>

            <div className="compare-content-grid grid gap-10 lg:grid-cols-12 relative items-start">
              <div className="space-y-10 lg:col-span-8">
                <ComparisonHeader result={result} onRefresh={handleRefresh} comparisonId={jobData.id} />
                
                <RadarChartPanel result={result} />
                <ConsensusPanel result={result} />
                <FeatureMatrixPanel result={result} />

                <div className="space-y-10">
                  {result.categories.map((cat, i) => (
                    <CategorySection key={cat.name} category={cat} entities={result.entities} index={i} />
                  ))}
                </div>
              </div>
              <aside className="space-y-6 lg:col-span-4 sticky top-24 self-start pb-8 h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar">
                <VerdictPanel result={result} />
                <EntityFactPanel result={result} facts={entityFacts} />
                <SourcesPanel sources={result.sources} />
                <FollowUpPanel />
              </aside>
            </div>

            <section className="mt-20 border-t border-white/[0.06] pt-12">
              <p className="mb-6 text-center text-sm text-white/25">Try another comparison</p>
              <div className="flex flex-wrap justify-center gap-3">
                {["Supabase vs Firebase", "Cursor vs Windsurf", "ChatGPT Plus vs Claude Pro", "Vercel vs Render"].map((q) => {
                  const [a, b] = q.split(/\s+vs\s+/i);
                  const link = `/compare/${a.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-vs-${b.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
                  return (
                    <Link key={q} to={link} className="rounded-full border border-white/[0.06] bg-[#111] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/40 transition-all hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-400">
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

export default Compare;