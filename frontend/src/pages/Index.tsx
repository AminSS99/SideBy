import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Search, Sparkles, Zap, ArrowRight, ShieldCheck, Scale, Cpu, Network, BookOpenText } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const featuredComparisons = [
  "Supabase vs Firebase",
  "Next.js vs Remix",
  "PostgreSQL vs MongoDB",
  "Tailwind vs CSS Modules",
  "Vercel vs Render",
  "Cursor vs Windsurf"
];

const Index = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".hero-badge", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".hero-title", { y: 30, opacity: 0, duration: 1, ease: "expo.out" }, "-=0.6")
      .from(".hero-desc", { y: 20, opacity: 0, duration: 0.8 }, "-=0.6")
      .from(".hero-search", { y: 20, opacity: 0, duration: 0.8, ease: "back.out(1.2)" }, "-=0.4")
      .from(".hero-featured", { opacity: 0, duration: 1 }, "-=0.4");

    // Features Grid Entrance
    gsap.from(".feature-card", {
      scrollTrigger: {
        trigger: ".features-grid",
        start: "top 80%",
      },
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: "power2.out"
    });

    // Orchestration Section Animation
    gsap.from(".orch-card", {
      scrollTrigger: {
        trigger: ".orchestration-section",
        start: "top 75%",
      },
      y: 50,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: "expo.out"
    });
    
    gsap.from(".orch-path", {
      scrollTrigger: {
        trigger: ".orchestration-section",
        start: "top 60%",
      },
      scaleX: 0,
      opacity: 0,
      transformOrigin: "left",
      duration: 1.5,
      ease: "power3.inOut"
    });

  }, { scope: containerRef });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // Convert "A vs B" to "a-vs-b" for the public comparison route
    const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    navigate(`/compare/${slug}`);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#030303] text-white overflow-x-hidden selection:bg-orange-500/30 pb-32">
      {/* Background Grid & Glow Effects */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-orange-600/[0.05] blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-40 border-b border-white/[0.06] bg-[#030303]/80 backdrop-blur-xl sticky top-0">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4 group cursor-default">
            <div className="flex h-10 w-10 items-center justify-center border border-[#333] bg-[#111] font-serif text-xl text-[#fdfbf7] transition-all group-hover:border-orange-500/50 group-hover:text-orange-400">
              S
            </div>
            <div>
              <p className="font-serif text-sm tracking-tight text-[#fdfbf7]">SideBy</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#fdfbf7]/40">Research Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/app" className="hidden sm:block text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">
              Workbench
            </Link>
            <Link
              to="/app"
              className="rounded-sm border border-[#333] bg-[#0c0b0a] hover:bg-[#1a1a1a] hover:border-white/20 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-all active:scale-[0.98]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center pb-24">
          <div className="hero-badge mb-6 flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400">
            <Sparkles className="h-3 w-3" />
            AI-Powered Technical Research
          </div>
          
          <h1 className="hero-title max-w-4xl font-serif text-5xl tracking-tight text-white md:text-7xl leading-[1.1]">
            The truth about your tech stack, <span className="bg-gradient-to-br from-orange-400 to-orange-600 bg-clip-text text-transparent italic font-light pr-2">side by side.</span>
          </h1>
          
          <p className="hero-desc mt-6 max-w-2xl text-lg text-white/50 font-light leading-relaxed">
            Stop digging through biased marketing pages and outdated Reddit threads. Generate deep, source-backed technical comparisons in seconds.
          </p>

          <form onSubmit={handleSearch} className="hero-search mt-10 w-full max-w-2xl relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
              <Search className="h-5 w-5 text-white/30 group-focus-within:text-orange-500 transition-colors" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Supabase vs Firebase..."
              className="w-full rounded-sm border border-[#333] bg-[#0c0b0a]/80 backdrop-blur-md py-5 pl-14 pr-36 text-lg text-white placeholder:text-white/20 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
            />
            <button
              type="submit"
              className="absolute inset-y-2 right-2 flex items-center gap-2 rounded-sm bg-[#fdfbf7] px-6 font-bold uppercase tracking-widest text-xs text-black hover:bg-[#e0e0e0] transition-colors active:scale-[0.98]"
            >
              Compare <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="hero-featured mt-16 flex flex-col items-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4">Trending Comparisons</p>
            <div className="flex flex-wrap justify-center gap-3 max-w-3xl">
              {featuredComparisons.map((comp) => {
                const slug = comp.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                return (
                  <Link
                    key={comp}
                    to={`/compare/${slug}`}
                    className="rounded-full border border-white/[0.06] bg-[#111] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/40 transition-all hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-400"
                  >
                    {comp}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="features-grid grid gap-6 md:grid-cols-3 pt-12 border-t border-[#2a2a2a]">
          <div className="feature-card border border-[#2a2a2a] bg-[#0c0b0a] p-8 rounded-sm hover:border-[#444] transition-colors">
            <div className="mb-6 inline-flex rounded-sm bg-[#111] border border-[#333] p-3 text-white">
              <Scale className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-2xl text-[#fdfbf7] mb-3">Unbiased Verdicts</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              We extract facts directly from official documentation, pricing pages, and GitHub repositories to give you the raw truth.
            </p>
          </div>
          <div className="feature-card border border-orange-500/30 bg-[#1a110a] shadow-[0_0_30px_rgba(234,88,12,0.05)] p-8 rounded-sm">
            <div className="mb-6 inline-flex rounded-sm bg-orange-500/10 border border-orange-500/20 p-3 text-orange-400">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-2xl text-[#fdfbf7] mb-3">Instant Generation</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              What used to take 3 days of reading docs and opening tabs now takes 30 seconds. Generate an entire matrix instantly.
            </p>
          </div>
          <div className="feature-card border border-[#2a2a2a] bg-[#0c0b0a] p-8 rounded-sm hover:border-[#444] transition-colors">
            <div className="mb-6 inline-flex rounded-sm bg-[#111] border border-[#333] p-3 text-cyan-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-2xl text-[#fdfbf7] mb-3">Source Backed</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              Every single claim is linked directly to the primary source so you can verify the information and trust the output.
            </p>
          </div>
        </div>

        {/* Orchestration Section */}
        <section className="orchestration-section mt-32 border-t border-[#2a2a2a] pt-24 pb-12">
          <div className="text-center mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500 mb-4 flex justify-center items-center gap-2">
              <Network className="h-3.5 w-3.5" /> Multi-Model Orchestration
            </p>
            <h2 className="font-serif text-4xl text-[#fdfbf7] md:text-5xl tracking-tight">The Right Engine for the Task</h2>
            <p className="mt-6 max-w-2xl mx-auto text-white/50 leading-relaxed">
              SideBy doesn't rely on a single model. We route your research queries dynamically across the best available AI models to balance speed, cost, and reasoning depth.
            </p>
          </div>
          
          <div className="relative max-w-4xl mx-auto">
            {/* Animated connection lines behind cards */}
            <div className="orch-path absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent -translate-y-1/2 z-0 hidden md:block" />
            
            <div className="grid gap-6 md:grid-cols-3 relative z-10">
              <div className="orch-card border border-[#2a2a2a] bg-[#111] p-8 rounded-sm text-center relative overflow-hidden group">
                <div className="absolute top-0 inset-x-0 h-1 bg-blue-500/50 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                <Cpu className="h-8 w-8 text-blue-400 mx-auto mb-4" />
                <h3 className="font-serif text-xl text-white mb-2">DeepSeek V3</h3>
                <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-3">Logic & Extraction</p>
                <p className="text-sm text-white/50">Used for fast, highly accurate data extraction from raw HTML sources.</p>
              </div>
              
              <div className="orch-card border border-orange-500/30 bg-[#1a110a] shadow-2xl p-8 rounded-sm text-center transform md:scale-110 z-20">
                <div className="absolute top-0 inset-x-0 h-1 bg-orange-500" />
                <div className="flex h-12 w-12 items-center justify-center border border-[#333] bg-[#0c0b0a] font-serif text-2xl text-[#fdfbf7] mx-auto mb-4">
                  S
                </div>
                <h3 className="font-serif text-xl text-white mb-2">SideBy Router</h3>
                <p className="text-xs text-orange-400 uppercase tracking-widest font-bold mb-3">Orchestration</p>
                <p className="text-sm text-white/60">Evaluates the query and intelligently splits tasks across providers.</p>
              </div>

              <div className="orch-card border border-[#2a2a2a] bg-[#111] p-8 rounded-sm text-center relative overflow-hidden group">
                <div className="absolute top-0 inset-x-0 h-1 bg-purple-500/50 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                <BookOpenText className="h-8 w-8 text-purple-400 mx-auto mb-4" />
                <h3 className="font-serif text-xl text-white mb-2">Gemini 2.0</h3>
                <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-3">Synthesis & Prose</p>
                <p className="text-sm text-white/50">Used for writing the final, nuanced executive verdicts and summaries.</p>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default Index;