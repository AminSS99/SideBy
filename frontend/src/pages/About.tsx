import { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight, CheckCircle2, FileSearch, Layers3, Scale, SearchCheck, Sparkles } from "lucide-react";
import { BrandFooter } from "@/components/brand/BrandFooter";
import { MarketingNav } from "@/components/brand/MarketingNav";
import { usePageTitle } from "@/hooks/usePageTitle";

const principles = [
  {
    icon: SearchCheck,
    eyebrow: "Evidence first",
    title: "A claim should show its work.",
    body: "SideBy keeps sources close to the facts they support, so a polished verdict never becomes a substitute for verification.",
    tone: "border-orange-300/20 bg-orange-400/8 text-orange-200",
  },
  {
    icon: Scale,
    eyebrow: "Context matters",
    title: "There is no universal winner.",
    body: "A good comparison changes when the budget, team, timeline, or risk changes. The brief is part of the answer.",
    tone: "border-sky-300/20 bg-sky-400/8 text-sky-200",
  },
  {
    icon: Layers3,
    eyebrow: "Inspectable AI",
    title: "Automation needs checkpoints.",
    body: "The research pipeline separates search, extraction, scoring, and synthesis so the final result can be examined—not merely accepted.",
    tone: "border-violet-300/20 bg-violet-400/8 text-violet-200",
  },
] as const;

const researchSteps = [
  ["01", "Parse", "Turn the question into clear entities and decision dimensions."],
  ["02", "Research", "Find relevant public sources and extract usable evidence."],
  ["03", "Compare", "Score each option against the same decision frame."],
  ["04", "Explain", "Build a verdict with assumptions, confidence, and citations."],
] as const;

const About = () => {
  usePageTitle("About");
  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(".about-reveal", {
        y: 28,
        duration: 0.75,
        stagger: 0.08,
        ease: "power3.out",
        clearProps: "transform",
      });
    },
    { scope: pageRef },
  );

  return (
    <div ref={pageRef} className="min-h-screen overflow-hidden bg-[#060504] text-[#fdfbf7] selection:bg-orange-500/30">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_5%,rgba(249,115,22,0.16),transparent_34%),radial-gradient(circle_at_90%_45%,rgba(56,189,248,0.08),transparent_30%),linear-gradient(rgba(255,255,255,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.022)_1px,transparent_1px)] bg-[size:auto,auto,52px_52px,52px_52px]" />
      <MarketingNav />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-24 pt-10 sm:px-6 sm:pt-16 lg:px-8">
        <section className="about-reveal overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-orange-950/20 lg:grid lg:grid-cols-[1.2fr_0.8fr]">
          <div className="px-5 py-9 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200">
              <Sparkles className="h-3.5 w-3.5" /> Why SideBy exists
            </div>
            <h1 className="max-w-4xl font-serif text-[2.75rem] leading-[0.96] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
              Decisions deserve more than <span className="bg-gradient-to-r from-orange-200 via-amber-100 to-rose-200 bg-clip-text text-transparent">a confident paragraph.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/58 sm:text-lg">
              SideBy turns a messy comparison question into a structured research trail: options, dimensions, evidence, scores, and a verdict you can challenge.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-black transition hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300">
                Compare something <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/docs" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.035] px-6 text-sm font-semibold text-white transition hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-orange-300">
                See how it works
              </Link>
            </div>
          </div>

          <div className="border-t border-white/10 bg-black/20 p-5 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">The old research loop</p>
            <div className="mt-5 space-y-3">
              {["Open another tab", "Find a conflicting claim", "Forget where it came from", "Repeat until the deadline"].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3.5 text-sm text-white/48">
                  <span className="font-mono text-[11px] text-white/25">0{index + 1}</span>
                  <span className="line-through decoration-white/20">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-300/20 bg-emerald-400/[0.07] p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <div>
                <p className="text-sm font-semibold text-emerald-100">One decision trail</p>
                <p className="mt-1 text-xs leading-5 text-white/45">The question, evidence, and conclusion stay connected.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="about-reveal mt-12 sm:mt-16">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200/70">How the engine thinks</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-white sm:text-5xl">Four visible stages. One answer you can inspect.</h2>
          </div>
          <div className="mt-7 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {researchSteps.map(([number, title, body]) => (
              <article key={number} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-orange-300/20 hover:bg-white/[0.05]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-orange-200/60">{number}</span>
                  <FileSearch className="h-4 w-4 text-white/25" />
                </div>
                <h3 className="mt-8 font-serif text-2xl text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/48">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-reveal mt-12 grid gap-4 sm:mt-16 lg:grid-cols-3">
          {principles.map((principle) => {
            const Icon = principle.icon;
            return (
              <article key={principle.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${principle.tone}`}><Icon className="h-5 w-5" /></div>
                <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">{principle.eyebrow}</p>
                <h3 className="mt-2 font-serif text-2xl leading-tight text-white">{principle.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/50">{principle.body}</p>
              </article>
            );
          })}
        </section>

        <section className="about-reveal mt-12 rounded-[2rem] border border-orange-300/15 bg-gradient-to-br from-orange-400/[0.09] via-white/[0.035] to-violet-400/[0.06] p-6 sm:mt-16 sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200/70">Built by SnapSolve Ink</p>
            <h2 className="mt-3 max-w-2xl font-serif text-3xl text-white sm:text-4xl">Less AI theatre. More decision clarity.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">SideBy is built for people who want the speed of AI without giving up the habit of checking the evidence.</p>
          </div>
          <Link to="/contact" className="mt-6 inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-white/15 bg-white px-6 text-sm font-bold text-black transition hover:bg-orange-100 lg:mt-0">
            Talk to the team <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-black/20 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <BrandFooter />
          <div className="flex gap-6">
            <Link to="/legal/privacy" className="text-[10px] font-bold uppercase tracking-widest text-white/40 transition hover:text-white">Privacy</Link>
            <Link to="/legal/security" className="text-[10px] font-bold uppercase tracking-widest text-white/40 transition hover:text-white">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
