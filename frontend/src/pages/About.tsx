import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight,
  CheckCircle2,
  FileSearch,
  GitCompareArrows,
  Layers3,
  Link2,
  Scale,
  SearchCheck,
  Sparkles,
  Unlink2,
} from "lucide-react";
import { MarketingFooter } from "@/components/brand/MarketingFooter";
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

const oldResearchLoop = [
  ["01", "Open another tab", "A new context to keep in your head."],
  ["02", "Find a conflicting claim", "No shared frame for resolving it."],
  ["03", "Forget where it came from", "Evidence separates from the answer."],
  ["04", "Repeat until the deadline", "More tabs, not more confidence."],
] as const;

const sideByTrail = [
  ["01", "Question", "The decision brief stays visible."],
  ["02", "Evidence", "Every claim keeps its source."],
  ["03", "Scores", "Options share one decision frame."],
  ["04", "Verdict", "The conclusion stays challengeable."],
] as const;

const ResearchLoopDemo = () => {
  const [mode, setMode] = useState<"old" | "sideby">("old");
  const isSideBy = mode === "sideby";
  const steps = isSideBy ? sideByTrail : oldResearchLoop;

  return (
    <div className="flex h-full flex-col" aria-label="Compare traditional research with SideBy">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch xl:flex-row xl:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">See the difference</p>
          <p className="mt-1 text-sm text-white/55">Same decision. A different research trail.</p>
        </div>
        <div className="grid shrink-0 grid-cols-2 rounded-full border border-white/10 bg-black/30 p-1" role="group" aria-label="Research approach">
          <button
            type="button"
            aria-pressed={!isSideBy}
            onClick={() => setMode("old")}
            className={`rounded-full px-3 py-2 text-xs font-semibold transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
              !isSideBy ? "bg-white/10 text-white shadow-sm" : "text-white/38 hover:text-white/65"
            }`}
          >
            Old loop
          </button>
          <button
            type="button"
            aria-pressed={isSideBy}
            onClick={() => setMode("sideby")}
            className={`rounded-full px-3 py-2 text-xs font-semibold transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
              isSideBy ? "bg-emerald-300 text-emerald-950 shadow-[0_0_24px_rgba(110,231,183,0.16)]" : "text-white/38 hover:text-white/65"
            }`}
          >
            With SideBy
          </button>
        </div>
      </div>

      <div key={mode} className="relative mt-6 flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
        {isSideBy && (
          <div className="absolute bottom-7 left-[1.42rem] top-7 w-px overflow-hidden bg-emerald-300/15" aria-hidden="true">
            <div className="h-full w-full origin-top animate-[about-trail_900ms_cubic-bezier(0.22,1,0.36,1)_both] bg-gradient-to-b from-emerald-200 via-emerald-400 to-cyan-300 motion-reduce:animate-none" />
          </div>
        )}
        <div className="space-y-3">
          {steps.map(([number, title, description], index) => (
            <div
              key={title}
              style={{ animationDelay: `${index * 90}ms` }}
              className={`group relative flex min-h-[4.55rem] items-center gap-3 rounded-xl border p-3.5 animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none ${
                isSideBy
                  ? "border-emerald-300/15 bg-emerald-400/[0.055] hover:border-emerald-300/30 hover:bg-emerald-400/[0.085]"
                  : `${index % 2 === 0 ? "sm:-translate-x-1" : "sm:translate-x-1"} border-white/8 bg-white/[0.025] hover:border-orange-200/15 hover:bg-white/[0.04]`
              } transition-colors duration-300`}
            >
              <span
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] transition ${
                  isSideBy ? "border-emerald-300/30 bg-[#0d211a] text-emerald-200" : "border-white/8 bg-[#0a0908] text-white/25"
                }`}
              >
                {number}
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${isSideBy ? "text-emerald-50" : "text-white/58 line-through decoration-white/20"}`}>{title}</p>
                <p className="mt-0.5 text-[11px] leading-4 text-white/32">{description}</p>
              </div>
              {isSideBy ? (
                <Link2 className="ml-auto h-4 w-4 shrink-0 text-emerald-300/45 transition group-hover:text-emerald-300" aria-hidden="true" />
              ) : (
                <Unlink2 className="ml-auto h-4 w-4 shrink-0 text-orange-200/18 transition group-hover:text-orange-200/38" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setMode(isSideBy ? "old" : "sideby")}
        className={`group mt-4 flex w-full items-start gap-3 rounded-xl border p-4 text-left transition duration-300 focus:outline-none focus-visible:ring-2 ${
          isSideBy
            ? "border-emerald-300/25 bg-emerald-400/[0.08] hover:bg-emerald-400/[0.12] focus-visible:ring-emerald-300"
            : "border-orange-200/15 bg-orange-300/[0.045] hover:border-orange-200/25 hover:bg-orange-300/[0.07] focus-visible:ring-orange-300"
        }`}
      >
        {isSideBy ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" /> : <GitCompareArrows className="mt-0.5 h-5 w-5 shrink-0 text-orange-200/70" />}
        <span className="min-w-0 flex-1">
          <span className={`block text-sm font-semibold ${isSideBy ? "text-emerald-100" : "text-orange-100"}`}>
            {isSideBy ? "One connected decision trail" : "Now connect the trail"}
          </span>
          <span className="mt-1 block text-xs leading-5 text-white/42">
            {isSideBy ? "Question, evidence, scores, and conclusion stay together." : "See how SideBy turns tab chaos into an inspectable answer."}
          </span>
        </span>
        <ArrowRight className={`mt-1 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1 ${isSideBy ? "rotate-180 text-emerald-200/60" : "text-orange-200/60"}`} aria-hidden="true" />
      </button>
    </div>
  );
};

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
            <ResearchLoopDemo />
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

      <MarketingFooter />
    </div>
  );
};

export default About;
