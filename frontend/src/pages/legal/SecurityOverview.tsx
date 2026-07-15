import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { AlertTriangle, ArrowRight, Check, ChevronDown, Database, KeyRound, LockKeyhole, ServerCog, ShieldCheck } from "lucide-react";
import { BrandFooter } from "@/components/brand/BrandFooter";
import { MarketingNav } from "@/components/brand/MarketingNav";
import { brand } from "@/config/brand";
import { usePageTitle } from "@/hooks/usePageTitle";

const controls = [
  {
    id: "identity",
    icon: LockKeyhole,
    title: "Identity and access",
    summary: "Authenticated routes verify the current user before returning private workspace data.",
    details: [
      "Clerk provides account and organization identity.",
      "Server routes use authentication guards before protected work begins.",
      "Workspace and organization identifiers scope access to comparisons, projects, and knowledge files.",
    ],
    tone: "border-orange-300/20 bg-orange-400/8 text-orange-200",
  },
  {
    id: "data",
    icon: Database,
    title: "Application data",
    summary: "SideBy uses managed Postgres and Redis services, with application-level tenant checks.",
    details: [
      "Drizzle ORM is used for parameterized database access.",
      "Private resources are checked against the requesting user or organization.",
      "Deleted knowledge documents are excluded from active retrieval flows.",
    ],
    tone: "border-sky-300/20 bg-sky-400/8 text-sky-200",
  },
  {
    id: "secrets",
    icon: KeyRound,
    title: "Secrets and API boundaries",
    summary: "Provider credentials stay on the server and are not bundled into the browser application.",
    details: [
      "Environment variables hold AI, search, extraction, database, and cache credentials.",
      "API inputs are validated before expensive research actions run.",
      "Rate limits protect comparison, follow-up, refresh, and export operations.",
    ],
    tone: "border-violet-300/20 bg-violet-400/8 text-violet-200",
  },
  {
    id: "browser",
    icon: ShieldCheck,
    title: "Browser protections",
    summary: "Production responses include defensive browser headers configured at the platform edge.",
    details: [
      "Content Security Policy restricts where scripts, styles, images, and connections may load from.",
      "HSTS asks supported browsers to use HTTPS for future visits.",
      "Frame and content-type protections reduce clickjacking and content-sniffing risk.",
    ],
    tone: "border-emerald-300/20 bg-emerald-400/8 text-emerald-200",
  },
] as const;

const dataPath = [
  ["1", "You ask", "A comparison prompt or uploaded knowledge file enters the authenticated app."],
  ["2", "SideBy researches", "Relevant content is sent to the providers needed for search, extraction, and synthesis."],
  ["3", "Results are stored", "Structured facts, sources, scores, and results are associated with the workspace."],
  ["4", "You control access", "Comparisons stay private unless an authorized user changes their visibility."],
] as const;

const SecurityOverview = () => {
  usePageTitle("Security");
  const pageRef = useRef<HTMLDivElement>(null);
  const [openControl, setOpenControl] = useState<string>("identity");

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(".security-reveal", { y: 28, duration: 0.75, stagger: 0.08, ease: "power3.out", clearProps: "transform" });
    },
    { scope: pageRef },
  );

  return (
    <div ref={pageRef} className="min-h-screen overflow-hidden bg-[#060504] text-[#fdfbf7] selection:bg-orange-500/30">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.11),transparent_34%),radial-gradient(circle_at_88%_35%,rgba(249,115,22,0.09),transparent_28%),linear-gradient(rgba(255,255,255,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.022)_1px,transparent_1px)] bg-[size:auto,auto,52px_52px,52px_52px]" />
      <MarketingNav />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-24 pt-10 sm:px-6 sm:pt-16 lg:px-8">
        <section className="security-reveal overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] px-5 py-9 shadow-2xl shadow-emerald-950/15 sm:px-10 sm:py-12 lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-12 lg:px-14 lg:py-14">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" /> Security overview
            </div>
            <h1 className="max-w-4xl font-serif text-[2.75rem] leading-[0.96] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
              Trust should be <span className="bg-gradient-to-r from-emerald-200 via-cyan-100 to-orange-200 bg-clip-text text-transparent">specific.</span>
            </h1>
          </div>
          <div className="mt-6 lg:mt-0">
            <p className="text-base leading-7 text-white/58">This page describes the protections visible in the SideBy implementation today. It is an engineering overview—not a security certification or audit report.</p>
            <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold text-white/45">
              <span className="rounded-full border border-white/10 px-3 py-1.5">Updated July 15, 2026</span>
              <span className="rounded-full border border-white/10 px-3 py-1.5">Plain-language summary</span>
            </div>
          </div>
        </section>

        <section className="security-reveal mt-8 grid gap-4 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
          <div>
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/65">Current controls</p>
              <h2 className="mt-2 font-serif text-3xl text-white sm:text-4xl">How the application is protected</h2>
            </div>
            <div className="space-y-3">
              {controls.map((control) => {
                const isOpen = openControl === control.id;
                const Icon = control.icon;
                return (
                  <article key={control.id} className={`overflow-hidden rounded-2xl border transition ${isOpen ? "border-emerald-300/20 bg-white/[0.055]" : "border-white/10 bg-white/[0.03] hover:border-white/20"}`}>
                    <button type="button" onClick={() => setOpenControl(isOpen ? "" : control.id)} aria-expanded={isOpen} aria-controls={`${control.id}-content`} className="flex min-h-[92px] w-full items-start gap-3 p-4 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-300 sm:items-center sm:gap-4 sm:p-5">
                      <span className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border sm:mt-0 ${control.tone}`}><Icon className="h-5 w-5" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-semibold text-white sm:text-lg">{control.title}</span>
                        <span className="mt-1 block text-sm leading-5 text-white/48">{control.summary}</span>
                      </span>
                      <ChevronDown className={`mt-2 h-5 w-5 shrink-0 text-white/35 transition-transform sm:mt-0 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div id={`${control.id}-content`} className="border-t border-white/8 px-4 pb-5 pt-4 sm:pl-20 sm:pr-7">
                        <ul className="space-y-3">
                          {control.details.map((detail) => <li key={detail} className="flex gap-3 text-sm leading-6 text-white/62"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />{detail}</li>)}
                        </ul>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-amber-300/20 bg-amber-400/[0.07] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-100"><AlertTriangle className="h-4 w-4" /> Keep sensitive material out</div>
              <p className="mt-3 text-sm leading-6 text-white/52">Do not place passwords, API keys, payment data, health records, or other regulated secrets in prompts or uploaded files.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <ServerCog className="h-5 w-5 text-white/35" />
              <h3 className="mt-4 font-serif text-2xl text-white">Found a vulnerability?</h3>
              <p className="mt-2 text-sm leading-6 text-white/48">Send a clear report with reproduction steps. Please do not access other users’ data while testing.</p>
              <a href={`mailto:security@${brand.domain}?subject=SideBy%20security%20report`} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm font-semibold text-white transition hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-300">security@{brand.domain} <ArrowRight className="h-4 w-4" /></a>
            </div>
          </aside>
        </section>

        <section className="security-reveal mt-12 sm:mt-16">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/65">Your data path</p>
            <h2 className="mt-2 font-serif text-3xl text-white sm:text-4xl">What happens when you run research</h2>
            <p className="mt-3 text-sm leading-6 text-white/48">SideBy relies on external providers to perform parts of the research pipeline. Only submit content you are authorized to process.</p>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {dataPath.map(([number, title, body]) => (
              <article key={number} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-400/8 font-mono text-xs text-emerald-200">{number}</span>
                <h3 className="mt-6 font-serif text-2xl text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/48">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="security-reveal mt-12 flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.035] p-6 sm:mt-16 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="font-serif text-2xl text-white">Need the legal details?</p>
            <p className="mt-1 text-sm leading-6 text-white/45">Privacy and terms describe the commitments that govern use of SideBy.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/legal/privacy" className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white hover:bg-white/5">Privacy</Link>
            <Link to="/legal/terms" className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white hover:bg-white/5">Terms</Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-black/20 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <BrandFooter />
          <div className="flex gap-6">
            <Link to="/legal/privacy" className="text-[10px] font-bold uppercase tracking-widest text-white/40 transition hover:text-white">Privacy</Link>
            <Link to="/contact" className="text-[10px] font-bold uppercase tracking-widest text-white/40 transition hover:text-white">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SecurityOverview;
