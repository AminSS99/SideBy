import React, { useRef } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { brand } from "@/config/brand";
import { envConfig } from "@/config/env";
import { researchSteps } from "@/lib/comparisonUtils";
import { useComparisonEngine } from "@/hooks/useComparisonEngine";
import {
  ResearchLoader,
  ComparisonHeader,
  CategorySection,
  VerdictPanel,
  SourcesPanel,
  FollowUpPanel,
  EntityFactPanel,
} from "@/components/Comparison/ComparisonEngine";
import { AnimatePresence } from "framer-motion";

const examples = [
  "ChatGPT Plus vs Claude Pro",
  "Supabase vs Firebase",
  "Cursor vs Windsurf",
  "Vercel vs Render",
  "Paddle vs RevenueCat",
];

const Index = () => {
  const {
    query,
    setQuery,
    result,
    isResearching,
    followUp,
    setFollowUp,
    followUpAnswer,
    startResearch,
    handleRefresh,
    askFollowUp,
    entityFacts,
    comparisonId,
    progress,
    activeStep,
  } = useComparisonEngine("Supabase vs Firebase for a SaaS");

  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Initial Hero Entrance Choreography
    const tl = gsap.timeline();
    tl.from(".hero-eyebrow", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".hero-title", { y: 40, opacity: 0, duration: 1, ease: "expo.out" }, "-=0.6")
      .from(".hero-desc", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.8")
      .from(".hero-input", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.6")
      .from(".hero-examples", { y: 10, opacity: 0, stagger: 0.1, duration: 0.5, ease: "power2.out" }, "-=0.4");
  }, { scope: pageRef });

  // Entrance animation for result wrapper when result changes
  useGSAP(() => {
    if (result && !isResearching) {
      gsap.from(".result-wrapper", {
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: "expo.out"
      });
    }
  }, [result, isResearching]);

  return (
    <div ref={pageRef} className="min-h-screen overflow-x-hidden bg-[#0c0b0a] text-[#fdfbf7] selection:bg-orange-500/30">
      
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#2a2a2a] bg-[#0c0b0a]/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-4" aria-label={brand.productName}>
            <div className="flex h-10 w-10 items-center justify-center border border-[#333] bg-[#111] font-serif text-xl text-[#fdfbf7]">
              S
            </div>
            <div>
              <p className="font-serif text-lg tracking-tight text-[#fdfbf7]">{brand.productName}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">Research Engine</p>
            </div>
          </Link>

          {envConfig.hasClerkConfig ? (
            <>
              <SignedIn>
                <div className="p-1">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="border border-[#fdfbf7] bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#fdfbf7] transition-colors hover:bg-[#fdfbf7] hover:text-[#0c0b0a]">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
            </>
          ) : (
            <Link
              to="/auth/sign-in"
              className="border border-[#fdfbf7] bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#fdfbf7] transition-colors hover:bg-[#fdfbf7] hover:text-[#0c0b0a]"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-32 pt-20 lg:px-8">
        {/* Editorial Hero */}
        <section className="mb-24 w-full max-w-4xl">
          <div className="hero-eyebrow mb-8 flex items-center gap-3 border-b-2 border-orange-600 pb-2 inline-flex">
            <Sparkles className="h-4 w-4 text-orange-500" /> 
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-orange-500">
              Editorial Intelligence
            </span>
          </div>
          <h1 className="hero-title mb-8 font-serif text-5xl leading-[1.05] text-[#fdfbf7] sm:text-6xl md:text-[5rem] tracking-tight">
            Compare anything with source-backed confidence.
          </h1>
          <p className="hero-desc max-w-2xl text-lg leading-relaxed text-[#fdfbf7]/60 font-serif md:text-xl">
            A premium engine that parses decisions, extracts official facts, and builds a living, nuanced matrix.
          </p>

          <div className="hero-input relative mt-12 flex w-full flex-col gap-4 border-b border-[#444] pb-4 transition-colors focus-within:border-orange-500 md:flex-row md:items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") startResearch(); }}
              placeholder="E.g., Vercel vs Render for a SaaS..."
              className="flex-1 bg-transparent font-serif text-2xl text-[#fdfbf7] placeholder:text-[#fdfbf7]/20 outline-none md:text-3xl"
            />
            <button
              onClick={() => startResearch()}
              disabled={isResearching}
              className="bg-[#fdfbf7] px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-[#0a0a0a] transition-all hover:bg-[#e0e0e0] disabled:opacity-50"
            >
              {isResearching ? "Researching..." : "Compare"}
            </button>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => startResearch(ex)}
                className="hero-examples border border-[#333] bg-[#111] px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/50 transition-all hover:border-orange-500/50 hover:bg-[#1a1a1a] hover:text-[#fdfbf7]"
              >
                {ex}
              </button>
            ))}
          </div>
        </section>

        {/* Results */}
        {(isResearching || result) && (
          <section className="border-t-4 border-[#2a2a2a] pt-20">
            <AnimatePresence mode="wait">
              {isResearching ? (
                <ResearchLoader
                  key="loading"
                  query={query}
                  progress={progress}
                  activeStep={activeStep}
                  steps={researchSteps}
                />
              ) : result ? (
                <div key="result" className="result-wrapper grid gap-12 lg:grid-cols-12">
                  <div className="space-y-12 lg:col-span-8">
                    <ComparisonHeader result={result} onRefresh={handleRefresh} comparisonId={comparisonId} />

                    <div className="space-y-12">
                      {result.categories.map((cat, i) => (
                        <CategorySection key={cat.name} category={cat} entities={result.entities} index={i} />
                      ))}
                    </div>
                  </div>

                  <aside className="space-y-8 lg:col-span-4">
                    <VerdictPanel result={result} />
                    <EntityFactPanel result={result} facts={entityFacts} />
                    <SourcesPanel sources={result.sources} />
                    <FollowUpPanel
                      question={followUp}
                      answer={followUpAnswer}
                      onQuestionChange={setFollowUp}
                      onAsk={askFollowUp}
                    />
                  </aside>
                </div>
              ) : null}
            </AnimatePresence>
          </section>
        )}
      </main>
    </div>
  );
};

export default Index;