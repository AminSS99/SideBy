import React, { useRef } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Sparkles, ArrowRight } from "lucide-react";
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
import { AnimatePresence, motion } from "framer-motion";

const examples = [
  "ChatGPT Plus vs Claude Pro",
  "Supabase vs Firebase",
  "Cursor vs Windsurf",
  "Vercel vs Render",
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
    // Elegant, centered entrance choreography
    const tl = gsap.timeline();
    tl.from(".hero-glow", { opacity: 0, scale: 0.8, duration: 1.5, ease: "power2.out" })
      .from(".hero-eyebrow", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=1.2")
      .from(".hero-title", { y: 30, opacity: 0, duration: 1.2, ease: "expo.out" }, "-=0.8")
      .from(".hero-input", { y: 30, opacity: 0, scale: 0.97, duration: 1, ease: "expo.out" }, "-=0.9")
      .from(".hero-examples button", { y: 15, opacity: 0, stagger: 0.08, duration: 0.6, ease: "power3.out" }, "-=0.7");
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
      <header className="absolute left-0 right-0 top-0 z-40 bg-transparent">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-4 group" aria-label={brand.productName}>
            <div className="flex h-10 w-10 items-center justify-center border border-[#333] bg-[#111] font-serif text-xl text-[#fdfbf7] transition-all group-hover:border-orange-500/50 group-hover:text-orange-400">
              S
            </div>
            <div>
              <p className="font-serif text-lg tracking-tight text-[#fdfbf7] group-hover:text-orange-50 transition-colors">{brand.productName}</p>
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
                  <button className="border border-[#fdfbf7]/20 bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#fdfbf7] transition-all hover:bg-[#fdfbf7] hover:text-[#0c0b0a]">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
            </>
          ) : (
            <Link
              to="/auth/sign-in"
              className="border border-[#fdfbf7]/20 bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#fdfbf7] transition-all hover:bg-[#fdfbf7] hover:text-[#0c0b0a]"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-32 lg:px-8">
        {/* Search-First Centered Hero */}
        <section className={`relative flex w-full flex-col items-center justify-center text-center transition-all duration-700 ease-in-out ${result || isResearching ? 'min-h-[40vh] pt-32 pb-12' : 'min-h-screen pb-20 pt-24'}`}>
          
          {/* Ambient Glow */}
          <div className="hero-glow absolute left-1/2 top-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-600/10 blur-[120px] pointer-events-none" />

          <div className="hero-eyebrow mb-8 inline-flex items-center gap-3 rounded-full border border-[#2a2a2a] bg-[#111]/50 px-4 py-2 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-orange-500" /> 
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#fdfbf7]/80">
              Source-Backed AI Comparison
            </span>
          </div>
          
          <h1 className="hero-title mb-10 max-w-5xl font-serif text-5xl leading-[1.05] text-[#fdfbf7] sm:text-6xl md:text-7xl lg:text-[5.5rem] tracking-tight">
            Compare anything. <br/>
            <span className="font-light italic text-[#fdfbf7]/40">Decide with confidence.</span>
          </h1>

          <div className="hero-input relative w-full max-w-4xl">
            <div className="group relative flex w-full flex-col items-center rounded-3xl border border-[#333] bg-[#0c0b0a]/80 p-2.5 backdrop-blur-2xl transition-all hover:border-[#555] focus-within:border-orange-500/50 focus-within:shadow-[0_0_50px_rgba(234,88,12,0.15)] sm:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") startResearch(); }}
                placeholder="e.g. Supabase vs Firebase for a startup"
                className="w-full bg-transparent px-6 py-5 font-serif text-2xl text-[#fdfbf7] placeholder:text-[#fdfbf7]/20 outline-none sm:text-3xl"
              />
              <button
                onClick={() => startResearch()}
                disabled={isResearching || !query.trim()}
                className="flex w-full h-14 sm:w-auto items-center justify-center gap-2 rounded-2xl bg-[#fdfbf7] px-8 text-xs font-bold uppercase tracking-widest text-[#0a0a0a] transition-all hover:bg-[#e0e0e0] hover:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 mt-2 sm:mt-0"
              >
                {isResearching ? "Running" : "Analyze"}
                {!isResearching && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>

            {/* Quick Examples */}
            <div className="hero-examples mt-8 flex flex-wrap items-center justify-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/30 mr-2 hidden sm:inline-block">Popular:</span>
              {examples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => startResearch(ex)}
                  className="rounded-full border border-[#2a2a2a] bg-[#111]/80 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60 backdrop-blur-md transition-all hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-400"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Results Area */}
        {(isResearching || result) && (
          <section className="relative mt-8">
            <AnimatePresence mode="wait">
              {isResearching ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <ResearchLoader
                    query={query}
                    progress={progress}
                    activeStep={activeStep}
                    steps={researchSteps}
                  />
                </motion.div>
              ) : result ? (
                <div key="result" className="result-wrapper grid gap-12 lg:grid-cols-12 border-t-4 border-[#2a2a2a] pt-16">
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