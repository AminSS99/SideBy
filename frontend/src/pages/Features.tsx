import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpenCheck,
  Database,
  FileCheck2,
  FileSearch,
  GitCompareArrows,
  LockKeyhole,
  MessageCircleQuestion,
  RefreshCw,
  Scale,
  SearchCheck,
  Sparkles,
  Users,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { BrandFooter } from "@/components/brand/BrandFooter";
import { MarketingNav } from "@/components/brand/MarketingNav";
import { usePageTitle } from "@/hooks/usePageTitle";

const FEATURES = [
  { id: "research", icon: FileSearch, eyebrow: "Research", title: "Find the evidence that matters", description: "Search credible sources, prioritize official documentation, and extract comparable facts without losing the original link.", proof: "Tavily search · Firecrawl extraction" },
  { id: "score", icon: Scale, eyebrow: "Decide", title: "Score the tradeoffs in context", description: "SideBy generates decision dimensions for your use case, scores both options, and explains how the verdict was reached.", proof: "Adaptive dimensions · cited verdict" },
  { id: "knowledge", icon: Database, eyebrow: "Ground", title: "Bring your own knowledge", description: "Upload project documents and use public requirement URLs to ground research in the constraints your team actually has.", proof: "PDF and CSV uploads · vector search" },
  { id: "refresh", icon: RefreshCw, eyebrow: "Maintain", title: "Refresh decisions as facts change", description: "Re-run source collection, preserve the prior result, and inspect how pricing, features, or recommendations changed.", proof: "Version history · change tracking" },
  { id: "followup", icon: MessageCircleQuestion, eyebrow: "Explore", title: "Ask follow-up questions", description: "Go deeper after the verdict with retrieval grounded in the comparison’s saved facts and source set.", proof: "Semantic retrieval · saved context" },
  { id: "team", icon: Users, eyebrow: "Collaborate", title: "Keep decisions reusable", description: "Organize research into workspaces and projects, add team notes, publish selected reports, and export the evidence trail.", proof: "Workspaces · notes · exports" },
] as const;

const PIPELINE = [
  { id: "discover", icon: SearchCheck, label: "Discover", body: "Find credible sources" },
  { id: "extract", icon: FileCheck2, label: "Extract", body: "Normalize cited facts" },
  { id: "compare", icon: GitCompareArrows, label: "Compare", body: "Score decision dimensions" },
  { id: "explain", icon: BookOpenCheck, label: "Explain", body: "Show the verdict path" },
] as const;

const Features = () => {
  usePageTitle("Features");
  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.timeline()
      .from(".feat-header", { y: 24, duration: 0.7, ease: "power3.out" })
      .from(".feat-pipeline", { y: 18, duration: 0.55, ease: "power2.out" }, "-=0.3")
      .from(".feat-card", { y: 28, stagger: 0.08, duration: 0.6, ease: "power3.out" }, "-=0.25");
  }, { scope: pageRef });

  return (
    <div ref={pageRef} className="relative min-h-screen overflow-hidden bg-[#070605] text-[#fdfbf7] selection:bg-orange-500/30">
      <div className="pointer-events-none fixed inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
      <div className="pointer-events-none absolute -left-40 top-40 h-[440px] w-[440px] rounded-full bg-orange-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute -right-48 top-[52rem] h-[500px] w-[500px] rounded-full bg-fuchsia-500/[0.07] blur-[150px]" />
      <MarketingNav />

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 sm:pb-28 sm:pt-20">
        <header className="feat-header mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/[0.08] px-3.5 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-orange-200"><Sparkles className="h-3.5 w-3.5" /> One decision workspace</div>
          <h1 className="mt-6 font-serif text-5xl leading-[0.94] tracking-[-0.04em] text-[#fffaf1] sm:text-7xl">
            From open question to <span className="bg-gradient-to-r from-orange-300 via-rose-300 to-fuchsia-300 bg-clip-text italic text-transparent">inspectable answer.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/50 sm:text-lg">
            SideBy combines search, extraction, scoring, and source tracking so your team can make a decision—and defend it later.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/" className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-500 px-6 text-[10px] font-bold uppercase tracking-[0.16em] text-white transition-transform hover:-translate-y-0.5">Try a comparison <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
            <Link to="/pricing" className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-6 text-[10px] font-bold uppercase tracking-[0.16em] text-white/65 transition-colors hover:bg-white/[0.07] hover:text-white">See pricing</Link>
          </div>
        </header>

        <section className="feat-pipeline mx-auto mt-12 max-w-5xl overflow-hidden rounded-[28px] border border-white/[0.09] bg-white/[0.03] p-4 sm:mt-16 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-4 px-1"><div><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-orange-300">How one run works</p><p className="mt-1 text-xs text-white/35">Evidence stays attached at every step.</p></div><LockKeyhole className="h-5 w-5 text-emerald-300" /></div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {PIPELINE.map((step, index) => (
              <div key={step.id} className="relative rounded-2xl border border-white/[0.07] bg-black/20 p-3.5 sm:p-4">
                <div className="flex items-center justify-between"><step.icon className="h-4 w-4 text-orange-300" /><span className="font-mono text-[8px] text-white/20">0{index + 1}</span></div>
                <p className="mt-4 text-sm font-semibold text-white">{step.label}</p><p className="mt-1 text-[10px] leading-4 text-white/35">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 sm:mt-24">
          <div className="mb-7 max-w-2xl"><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-orange-300">Built around the decision</p><h2 className="mt-3 font-serif text-4xl leading-tight text-white sm:text-5xl">Research tools that stay connected.</h2><p className="mt-4 text-sm leading-6 text-white/45">Each capability feeds the same source-backed record instead of creating another disconnected document.</p></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <article key={feature.id} className="feat-card group relative overflow-hidden rounded-[28px] border border-white/[0.09] bg-gradient-to-br from-white/[0.05] to-transparent p-5 transition duration-300 hover:-translate-y-1 hover:border-orange-300/20 sm:p-7">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="flex items-start justify-between gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-300/15 bg-orange-400/[0.08] text-orange-300"><feature.icon className="h-5 w-5" /></div><span className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/25">{feature.eyebrow}</span></div>
                <h3 className="mt-6 font-serif text-2xl leading-tight text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/45">{feature.description}</p>
                <p className="mt-6 border-t border-white/[0.07] pt-4 text-[9px] font-bold uppercase tracking-[0.14em] text-orange-200/60">{feature.proof}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="relative mt-16 overflow-hidden rounded-[32px] border border-orange-300/15 bg-[radial-gradient(circle_at_15%_15%,rgba(249,115,22,.18),transparent_36%),radial-gradient(circle_at_90%_85%,rgba(217,70,239,.12),transparent_42%),#100c0a] p-6 text-center shadow-[0_35px_100px_-50px_rgba(249,115,22,.7)] sm:mt-24 sm:p-12">
          <GitCompareArrows className="mx-auto h-7 w-7 text-orange-300" />
          <h2 className="mx-auto mt-5 max-w-3xl font-serif text-4xl leading-tight text-white sm:text-6xl">Bring the options. Keep the evidence.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/50 sm:text-base">Your first five daily comparisons are free, with no payment details required.</p>
          <Link to="/auth/sign-up" className="group mt-7 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-white px-6 text-[10px] font-bold uppercase tracking-[0.16em] text-black transition-transform hover:-translate-y-0.5">Start free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
        </section>

        <section className="mx-auto mt-12 grid max-w-4xl grid-cols-3 gap-2 sm:gap-4">
          {[[LockKeyhole, "Server-side keys"], [Database, "Workspace isolation"], [Scale, "Usage guardrails"]].map(([Icon, label]) => { const TrustIcon = Icon as typeof LockKeyhole; return <div key={label as string} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 text-center sm:p-5"><TrustIcon className="mx-auto h-4 w-4 text-emerald-300" /><p className="mt-2 text-[8px] font-bold uppercase tracking-wider text-white/40 sm:text-[9px]">{label as string}</p></div>; })}
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.08] bg-black/25"><div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6"><BrandFooter /><div className="flex gap-5 text-[9px] font-bold uppercase tracking-widest text-white/35"><Link to="/legal/privacy">Privacy</Link><Link to="/legal/terms">Terms</Link></div></div></footer>
    </div>
  );
};

export default Features;
