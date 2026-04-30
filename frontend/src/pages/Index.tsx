import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Search, Sparkles, Zap, ArrowRight, ShieldCheck, Scale } from "lucide-react";

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
      .from(".hero-featured", { opacity: 0, duration: 1 }, "-=0.4")
      .from(".features-grid .feature-card", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out"
      }, "-=0.6");
  }, { scope: containerRef });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // Convert "A vs B" to "a-vs-b" for the public comparison route
    const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    navigate(`/compare/${slug}`);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#030303] text-white overflow-hidden selection:bg-orange-500/30">
      {/* Background Grid & Glow Effects */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-orange-600/[0.05] blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-40 border-b border-white/[0.06] bg-[#030303]/50 backdrop-blur-xl">
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
              className="rounded-sm bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.98]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-32 pb-24 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <div className="hero-badge mb-6 flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400">
            <Sparkles className="h-3 w-3" />
            AI-Powered Technical Research
          </div>
          
          <h1 className="hero-title max-w-4xl font-serif text-5xl tracking-tight text-white sm:text-7xl">
            The truth about your tech stack, <span className="bg-gradient-to-br from-orange-400 to-orange-600 bg-clip-text text-transparent italic font-light pr-2">side by side.</span>
          </h1>
          
          <p className="hero-desc mt-6 max-w-2xl text-lg text-white/40 font-light leading-relaxed">
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
              className="w-full rounded-sm border border-white/10 bg-[#111]/80 backdrop-blur-md py-5 pl-14 pr-36 text-lg text-white placeholder:text-white/20 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all shadow-2xl"
            />
            <button
              type="submit"
              className="absolute inset-y-2 right-2 flex items-center gap-2 rounded-sm bg-[#fdfbf7] px-6 font-bold uppercase tracking-widest text-xs text-black hover:bg-[#e0e0e0] transition-colors active:scale-[0.98]"
            >
              Compare <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="hero-featured mt-12 flex flex-col items-center">
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
        <div className="features-grid mt-32 grid gap-6 md:grid-cols-3">
          <div className="feature-card border border-white/[0.06] bg-[#0c0b0a] p-8 rounded-sm hover:border-white/10 transition-colors">
            <div className="mb-5 inline-flex rounded-sm bg-[#111] border border-[#333] p-3 text-white">
              <Scale className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-xl text-white mb-2">Unbiased Verdicts</h3>
            <p className="text-sm text-white/40 leading-relaxed">
              We extract facts directly from official documentation and GitHub repositories to give you the raw truth.
            </p>
          </div>
          <div className="feature-card border border-white/[0.06] bg-[#0c0b0a] p-8 rounded-sm hover:border-white/10 transition-colors">
            <div className="mb-5 inline-flex rounded-sm bg-[#111] border border-[#333] p-3 text-orange-500">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-xl text-white mb-2">Instant Generation</h3>
            <p className="text-sm text-white/40 leading-relaxed">
              What used to take 3 days of reading docs now takes 30 seconds. Generate an entire matrix instantly.
            </p>
          </div>
          <div className="feature-card border border-white/[0.06] bg-[#0c0b0a] p-8 rounded-sm hover:border-white/10 transition-colors">
            <div className="mb-5 inline-flex rounded-sm bg-[#111] border border-[#333] p-3 text-cyan-500">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-xl text-white mb-2">Source Backed</h3>
            <p className="text-sm text-white/40 leading-relaxed">
              Every single claim is linked directly to the primary source so you can verify the information yourself.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;