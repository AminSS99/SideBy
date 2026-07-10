import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Search, Sparkles, Zap, ArrowRight, ShieldCheck, Scale, Cpu, Network, BookOpenText, Loader2 } from "lucide-react";
import { BrandFooter } from "@/components/brand/BrandFooter";
import { MarketingNav } from "@/components/brand/MarketingNav";
import { AmbientOrbs } from "@/components/AmbientOrbs";
import { analyzeQueryIntent, type QueryIntent } from "@/lib/queryIntent";
import { SUPPORTED_COMPARISON_CATEGORIES } from "@/lib/comparisonTaxonomy";
import { usePageTitle } from "@/hooks/usePageTitle";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { useAuth } from "@/contexts/AuthContext";

gsap.registerPlugin(ScrollTrigger);

const featuredComparisons = SUPPORTED_COMPARISON_CATEGORIES.flatMap((category) =>
  category.examples.slice(0, 1).map((label) => ({
    label,
    category: category.shortLabel,
    sourceRequirement: category.sourceRequirements[0] || "Source-backed",
  })),
).slice(0, 9);

const quickStartComparisons = [
  "React vs Vue for a SaaS",
  "Supabase vs Firebase",
  "Cursor vs Windsurf",
  "Notion vs Linear",
  "ChatGPT Plus vs Claude Pro",
  "ETFs vs mutual funds",
];

const Index = () => {
  usePageTitle("AI-Powered Comparisons");
  const [query, setQuery] = useState("");
  const localQueryIntent = analyzeQueryIntent(query);
  const [validatedIntent, setValidatedIntent] = useState<QueryIntent | null>(null);
  const [validatedQuery, setValidatedQuery] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const validationSequence = useRef(0);
  const queryIntent = validatedQuery === query.trim() && validatedIntent
    ? validatedIntent
    : localQueryIntent;
  const { session } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const validateQuery = async (value: string) => {
    const clean = value.trim();
    const localIntent = analyzeQueryIntent(clean);
    if (!localIntent.canStart) {
      setValidatedQuery(clean);
      setValidatedIntent(localIntent);
      return localIntent;
    }

    const sequence = ++validationSequence.current;
    setIsValidating(true);
    try {
      const response = await apiFetch(buildApiUrl("/api/comparisons/validate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: clean }),
      }, { retries: 0 });
      const data = await response.json() as { intent: QueryIntent };
      if (sequence === validationSequence.current) {
        setValidatedQuery(clean);
        setValidatedIntent(data.intent);
      }
      return data.intent;
    } catch {
      const fallback = localIntent.category === "general_research" && localIntent.confidence < 0.6
        ? {
            ...localIntent,
            canStart: false,
            status: "needs_context" as const,
            message: "We could not verify that these options share a meaningful comparison frame. Add a concrete use case or try again.",
          }
        : localIntent;
      if (sequence === validationSequence.current) {
        setValidatedQuery(clean);
        setValidatedIntent(fallback);
      }
      return fallback;
    } finally {
      if (sequence === validationSequence.current) setIsValidating(false);
    }
  };

  useEffect(() => {
    const clean = query.trim();
    setValidatedIntent(null);
    setValidatedQuery("");
    if (!clean || !localQueryIntent.canStart) return;

    const timeout = window.setTimeout(() => {
      void validateQuery(clean);
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [query, localQueryIntent.canStart]);

  // Parallax Effect
  useEffect(() => {
    if (!heroRef.current) return;
    const hero = heroRef.current;

    const title = hero.querySelector(".parallax-title");
    const desc = hero.querySelector(".parallax-desc");
    if (!title || !desc) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const xToTitle = gsap.quickTo(title, "x", { duration: 0.8, ease: "power3" });
    const yToTitle = gsap.quickTo(title, "y", { duration: 0.8, ease: "power3" });

    const xToDesc = gsap.quickTo(desc, "x", { duration: 1, ease: "power3" });
    const yToDesc = gsap.quickTo(desc, "y", { duration: 1, ease: "power3" });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      xToTitle(x * -20);
      yToTitle(y * -20);

      xToDesc(x * -10);
      yToDesc(y * -10);
    };

    const handleMouseLeave = () => {
      xToTitle(0); yToTitle(0);
      xToDesc(0); yToDesc(0);
    };

    hero.addEventListener("mousemove", handleMouseMove);
    hero.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      hero.removeEventListener("mousemove", handleMouseMove);
      hero.removeEventListener("mouseleave", handleMouseLeave);
      gsap.killTweensOf(title);
      gsap.killTweensOf(desc);
    };
  }, []);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(".hero-badge, .parallax-title, .parallax-desc, .hero-search, .hero-featured, .starter-card, .feature-card, .orch-card", {
        clearProps: "all",
        opacity: 1,
      });
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set(".hero-badge, .parallax-title, .parallax-desc, .hero-search, .hero-featured", {
        willChange: "transform, opacity, filter",
      });
      gsap.set(".starter-card, .feature-card, .orch-card", {
        transformPerspective: 900,
        transformOrigin: "center",
        willChange: "transform, opacity, border-color",
      });

      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from(".hero-badge", { y: 24, opacity: 0, filter: "blur(10px)", duration: 0.8 })
        .from(".parallax-title", { y: 44, opacity: 0, filter: "blur(14px)", duration: 1.15 }, "-=0.48")
        .from(".parallax-desc", { y: 24, opacity: 0, filter: "blur(8px)", duration: 0.82 }, "-=0.72")
        .from(".hero-search", { y: 28, opacity: 0, scale: 0.97, filter: "blur(10px)", duration: 0.9, ease: "back.out(1.25)" }, "-=0.5")
        .from(".hero-featured", { y: 16, opacity: 0, duration: 0.72 }, "-=0.5")
        .from(".quick-start-chip", { y: 16, opacity: 0, stagger: 0.045, duration: 0.48, ease: "power3.out" }, "-=0.5")
        .from(".starter-card", { y: 18, rotateX: -4, stagger: 0.045, duration: 0.55, ease: "power3.out" }, "-=0.25");

      gsap.to(".hero-search-shell", {
        boxShadow: "0 28px 80px rgba(234,88,12,0.18)",
        borderColor: "rgba(234,88,12,0.45)",
        duration: 1.8,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });

      gsap.from(".feature-card", {
        scrollTrigger: {
          trigger: ".features-grid",
          start: "top 82%",
          end: "bottom 55%",
          scrub: 0.6,
        },
        y: 58,
        opacity: 0,
        rotateX: -10,
        stagger: 0.14,
        ease: "none",
      });

      gsap.from(".feature-icon", {
        scrollTrigger: {
          trigger: ".features-grid",
          start: "top 72%",
          toggleActions: "play none none reverse",
        },
        scale: 0.72,
        rotate: -8,
        opacity: 0,
        stagger: 0.1,
        duration: 0.7,
        ease: "back.out(1.7)",
      });

      gsap.from(".orchestration-heading > *", {
        scrollTrigger: {
          trigger: ".orchestration-section",
          start: "top 72%",
          toggleActions: "play none none reverse",
        },
        y: 28,
        opacity: 0,
        stagger: 0.1,
        duration: 0.9,
        ease: "power3.out",
      });

      gsap.from(".orch-card", {
        scrollTrigger: {
          trigger: ".orchestration-section",
          start: "top 66%",
          toggleActions: "play none none reverse",
        },
        y: 70,
        opacity: 0,
        rotateY: 10,
        stagger: 0.16,
        duration: 1,
        ease: "expo.out",
      });

      gsap.from(".orch-path", {
        scrollTrigger: {
          trigger: ".orchestration-section",
          start: "top 58%",
          end: "top 30%",
          scrub: 0.8,
        },
        scaleX: 0,
        opacity: 0,
        transformOrigin: "left",
        ease: "none",
      });

      const tiltCards = gsap.utils.toArray<HTMLElement>(".starter-card, .feature-card, .orch-card");
      const listeners = tiltCards.map((card) => {
        const rotateX = gsap.quickTo(card, "rotationX", { duration: 0.45, ease: "power3.out" });
        const rotateY = gsap.quickTo(card, "rotationY", { duration: 0.45, ease: "power3.out" });
        const y = gsap.quickTo(card, "y", { duration: 0.45, ease: "power3.out" });

        const move = (event: MouseEvent) => {
          const rect = card.getBoundingClientRect();
          const relX = (event.clientX - rect.left) / rect.width - 0.5;
          const relY = (event.clientY - rect.top) / rect.height - 0.5;
          rotateX(relY * -5);
          rotateY(relX * 7);
          y(-4);
        };
        const leave = () => {
          rotateX(0);
          rotateY(0);
          y(0);
        };

        card.addEventListener("mousemove", move);
        card.addEventListener("mouseleave", leave);
        return () => {
          card.removeEventListener("mousemove", move);
          card.removeEventListener("mouseleave", leave);
          gsap.killTweensOf(card);
        };
      });

      return () => {
        listeners.forEach((cleanup) => cleanup());
      };
    });

    return () => mm.revert();
  }, { scope: containerRef });

  const beginComparison = async (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    setQuery(clean);

    const intent = validatedQuery === clean && validatedIntent
      ? validatedIntent
      : await validateQuery(clean);
    if (!intent.canStart) return;

    const destination = `/app/comparisons?q=${encodeURIComponent(clean)}`;
    if (session) {
      navigate(destination);
      return;
    }
    navigate(`/auth/sign-in?redirect_url=${encodeURIComponent(destination)}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void beginComparison(query);
  };

  const handleQuickStart = (q: string) => {
    void beginComparison(q);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#030303] text-white overflow-x-hidden selection:bg-orange-500/30 relative">
      <div className="pointer-events-none fixed inset-0 opacity-[0.03] z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      
      <AmbientOrbs />

      <MarketingNav />

      <main className="relative z-10 mx-auto -mt-8 max-w-7xl px-4 pt-24 sm:px-6 pb-24">
        {/* Hero Section */}
        <div ref={heroRef} className="flex flex-col items-center text-center pb-24 relative perspective-1000">
          <div className="hero-badge mb-6 flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300 transform-style-3d shadow-[0_0_38px_rgba(234,88,12,0.12)]">
            <Sparkles className="h-3 w-3" />
            Sources checked before verdicts
          </div>
          
          <h1 className="parallax-title max-w-4xl font-serif text-5xl tracking-tight text-white md:text-7xl leading-[1.1] transform-style-3d">
            Compare with receipts. <span className="bg-gradient-to-br from-orange-400 to-orange-600 bg-clip-text text-transparent italic font-light pr-2">Decide with confidence.</span>
          </h1>
          
          <p className="parallax-desc mt-6 max-w-2xl text-lg text-white/50 font-light leading-relaxed transform-style-3d">
            SideBy turns messy research into an evidence map: sources, facts, scoring dimensions, and a verdict you can audit before you act.
          </p>

          <form onSubmit={handleSearch} className="hero-search mt-10 w-full max-w-2xl group transform-translate-z-10">
            <div className="hero-search-shell relative rounded-sm border border-transparent">
              <div className="pointer-events-none absolute left-0 top-0 flex h-[66px] items-center pl-5">
                <Search className="h-5 w-5 text-white/30 group-focus-within:text-orange-500 transition-colors" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., Supabase vs Firebase..."
                className="w-full rounded-sm border border-[#333] bg-[#0c0b0a] py-5 pl-14 pr-5 text-base text-white placeholder:text-white/20 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.4)] sm:pr-36 sm:text-lg"
              />
              <button
                type="submit"
                disabled={isValidating || (Boolean(query.trim()) && !queryIntent.canStart)}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-sm bg-[#fdfbf7] px-6 py-4 font-bold uppercase tracking-widest text-xs text-black hover:bg-[#e0e0e0] transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:absolute sm:inset-y-2 sm:right-2 sm:mt-0 sm:w-auto sm:py-0"
              >
                {isValidating ? (
                  <>Checking <Loader2 className="h-3.5 w-3.5 animate-spin" /></>
                ) : (
                  <>Compare <ArrowRight className="h-3.5 w-3.5" /></>
                )}
              </button>
            </div>
            {query.trim() && (
              <div className={[
                "mt-3 rounded-sm border px-4 py-3 text-left text-xs leading-relaxed",
                queryIntent.canStart
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200/80"
                  : "border-amber-500/25 bg-amber-500/10 text-amber-100/80",
              ].join(" ")}>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-bold uppercase tracking-widest text-[9px]">
                    {isValidating ? "Checking comparison fit" : `Comparison fit - ${Math.round(queryIntent.confidence * 100)}%`}
                  </span>
                  {queryIntent.categoryLabel && (
                    <span className="text-[9px] uppercase tracking-widest opacity-70">
                      {queryIntent.categoryLabel}
                    </span>
                  )}
                </div>
                <p className="mt-1">{queryIntent.message}</p>
                {queryIntent.suggestion && (
                  <button
                    type="button"
                    onClick={() => setQuery(queryIntent.suggestion || "")}
                    className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/70 underline decoration-white/20 underline-offset-4 hover:text-white"
                  >
                    Try: {queryIntent.suggestion}
                  </button>
                )}
              </div>
            )}
            <p className="mt-3 text-center text-[10px] text-white/25">
              We verify the pair first. Sign in only when it is ready for research.
            </p>
          </form>

          {/* Quick-start one-click comparisons */}
          <div className="hero-featured mt-16 flex flex-col items-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4">Try one-click research</p>
            <div className="flex flex-wrap justify-center gap-3 max-w-3xl">
              {quickStartComparisons.map((comp) => (
                <button
                  key={comp}
                  type="button"
                  onClick={() => handleQuickStart(comp)}
                  className="quick-start-chip rounded-full border border-white/[0.06] bg-[#111] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/40 transition-all hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-400"
                >
                  {comp}
                </button>
              ))}
            </div>
          </div>

          {/* Starter comparisons */}
          <div className="mt-12 flex w-full max-w-5xl flex-col items-center rounded-sm border border-white/[0.08] bg-white/[0.025] px-4 py-7 shadow-[0_28px_80px_rgba(0,0,0,0.35)] sm:px-6 sm:py-8">
            <div className="mb-6 flex w-full flex-col items-start justify-between gap-2 sm:flex-row sm:items-end">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">Starter comparisons</p>
              <p className="text-xs text-white/35">Pick one and SideBy starts the research map.</p>
            </div>
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredComparisons.map((comp) => {
                return (
                  <button
                    key={comp.label}
                    type="button"
                    onClick={() => handleQuickStart(comp.label)}
                    className="starter-card group relative min-h-[150px] overflow-hidden rounded-sm border border-white/[0.1] bg-[#11100e] p-5 text-left shadow-[0_14px_36px_rgba(0,0,0,0.28)] transition-all hover:-translate-y-1 hover:border-orange-500/35 hover:bg-[#1a110a] hover:shadow-[0_0_34px_rgba(234,88,12,0.1)]"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-orange-500/70">{comp.category}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/35">Policy mapped</span>
                    </div>
                    <p className="font-serif text-lg text-[#fdfbf7] mb-2 group-hover:text-orange-400 transition-colors">
                      {comp.label}
                    </p>
                    <p className="text-xs leading-relaxed text-white/50">{comp.sourceRequirement}</p>
                    <div className="absolute bottom-4 right-4 opacity-35 transition-opacity group-hover:opacity-100">
                      <ArrowRight className="h-4 w-4 text-orange-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="features-grid grid gap-6 md:grid-cols-3 pt-12 border-t border-[#2a2a2a]">
          <div className="feature-card border border-[#2a2a2a] bg-[#0c0b0a] p-8 rounded-sm hover:border-[#444] transition-colors">
            <div className="feature-icon mb-6 inline-flex rounded-sm bg-[#111] border border-[#333] p-3 text-white">
              <Scale className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-2xl text-[#fdfbf7] mb-3">Unbiased Verdicts</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              We extract facts directly from official documentation, pricing pages, and GitHub repositories to give you the raw truth.
            </p>
          </div>
          <div className="feature-card border border-orange-500/30 bg-[#1a110a] shadow-[0_0_30px_rgba(234,88,12,0.05)] p-8 rounded-sm">
            <div className="feature-icon mb-6 inline-flex rounded-sm bg-orange-500/10 border border-orange-500/20 p-3 text-orange-400">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-2xl text-[#fdfbf7] mb-3">Instant Generation</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              What used to take 3 days of reading docs and opening tabs now takes 30 seconds. Generate an entire matrix instantly.
            </p>
          </div>
          <div className="feature-card border border-[#2a2a2a] bg-[#0c0b0a] p-8 rounded-sm hover:border-[#444] transition-colors">
            <div className="feature-icon mb-6 inline-flex rounded-sm bg-[#111] border border-[#333] p-3 text-cyan-400">
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
          <div className="orchestration-heading text-center mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500 mb-4 flex justify-center items-center gap-2">
              <Network className="h-3.5 w-3.5" /> Multi-Model Orchestration
            </p>
            <h2 className="font-serif text-4xl text-[#fdfbf7] md:text-5xl tracking-tight">The Right Engine for the Task</h2>
            <p className="mt-6 max-w-2xl mx-auto text-white/50 leading-relaxed">
              SideBy routes research across Gemini 3.1 Pro and DeepSeek V4 Pro so each step gets the right mix of reasoning, extraction, and synthesis.
            </p>
          </div>
          
          <div className="relative max-w-4xl mx-auto">
            <div className="orch-path absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent -translate-y-1/2 z-0 hidden md:block" />
            
            <div className="grid gap-6 md:grid-cols-3 relative z-10">
              <div className="orch-card border border-[#2a2a2a] bg-[#111] p-8 rounded-sm text-center relative overflow-hidden group">
                <div className="absolute top-0 inset-x-0 h-1 bg-blue-500/50 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                <Cpu className="h-8 w-8 text-blue-400 mx-auto mb-4" />
                <h3 className="font-serif text-xl text-white mb-2">DeepSeek V4 Pro</h3>
                <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-3">Logic & Extraction</p>
                <p className="text-sm text-white/50">Used for fast, highly accurate logic, extraction, and source normalization from raw web evidence.</p>
              </div>
              
              <div className="orch-card border border-orange-500/30 bg-[#1a110a] shadow-2xl p-8 rounded-sm text-center transform md:scale-110 z-20">
                <div className="absolute top-0 inset-x-0 h-1 bg-orange-500" />
                <img src="/sideby.ico" alt="SideBy Router" className="h-12 w-12 object-contain rounded-sm mx-auto mb-4" />
                <h3 className="font-serif text-xl text-white mb-2">SideBy Router</h3>
                <p className="text-xs text-orange-400 uppercase tracking-widest font-bold mb-3">Orchestration</p>
                <p className="text-sm text-white/60">Evaluates the query and intelligently splits tasks across providers.</p>
              </div>

              <div className="orch-card border border-[#2a2a2a] bg-[#111] p-8 rounded-sm text-center relative overflow-hidden group">
                <div className="absolute top-0 inset-x-0 h-1 bg-purple-500/50 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                <BookOpenText className="h-8 w-8 text-purple-400 mx-auto mb-4" />
                <h3 className="font-serif text-xl text-white mb-2">Gemini 3.1 Pro</h3>
                <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-3">Synthesis & Prose</p>
                <p className="text-sm text-white/50">Used for deep synthesis, tradeoff analysis, and final executive verdicts.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Premium Footer */}
      <footer className="relative z-10 border-t border-[#2a2a2a] bg-[#080808] pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 md:grid-cols-4 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <img src="/sideby.ico" alt="SideBy" className="h-7 w-7 object-contain rounded-sm" />
                <span className="font-serif text-lg tracking-tight text-[#fdfbf7]">SideBy</span>
              </div>
              <p className="text-sm text-white/40 max-w-sm leading-relaxed mb-6">
                The source-backed AI comparison engine. Every claim is linked to a primary source so you can verify the information and trust the output.
              </p>
            </div>
            
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 mb-6">Product</h4>
              <ul className="space-y-4">
                <li><Link to="/features" className="text-sm text-white/40 hover:text-orange-400 transition-colors">Features</Link></li>
                <li><Link to="/docs" className="text-sm text-white/40 hover:text-orange-400 transition-colors">Documentation</Link></li>
                <li><Link to="/app" className="text-sm text-white/40 hover:text-orange-400 transition-colors">Workbench</Link></li>
                <li><Link to="/pricing" className="text-sm text-white/40 hover:text-orange-400 transition-colors">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 mb-6">Company</h4>
              <ul className="space-y-4">
                <li><Link to="/about" className="text-sm text-white/40 hover:text-orange-400 transition-colors">About SnapSolve Ink</Link></li>
                <li><Link to="/blog" className="text-sm text-white/40 hover:text-orange-400 transition-colors">Blog</Link></li>
                <li><Link to="/contact" className="text-sm text-white/40 hover:text-orange-400 transition-colors">Contact Sales</Link></li>
                <li><Link to="/legal/privacy" className="text-sm text-white/40 hover:text-orange-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/legal/terms" className="text-sm text-white/40 hover:text-orange-400 transition-colors">Terms of Service</Link></li>
                <li><Link to="/legal/cookies" className="text-sm text-white/40 hover:text-orange-400 transition-colors">Cookies Policy</Link></li>
                <li><Link to="/legal/refund" className="text-sm text-white/40 hover:text-orange-400 transition-colors">Refund Policy</Link></li>
                <li><Link to="/legal/security" className="text-sm text-white/40 hover:text-orange-400 transition-colors">Security Overview</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-[#2a2a2a] pt-8 grid gap-4 md:grid-cols-3 md:items-center">
            <p className="text-center text-xs text-white/30 md:text-left">
              &copy; {new Date().getFullYear()} SnapSolve Ink. All rights reserved.
            </p>
            <div className="flex justify-center">
              <BrandFooter />
            </div>
            <div className="flex items-center justify-center gap-6 md:justify-end">
              <a href="#" className="text-white/30 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
              </a>
              <a href="#" className="text-white/30 hover:text-white transition-colors">
                <span className="sr-only">GitHub</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
