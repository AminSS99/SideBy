import snapCredit from './snap-credit.module.css';
import composerStyles from '@/components/landing/landing-composer.module.css';
import { useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight,
  CheckCircle2,
  ChartNoAxesCombined,
  FileCheck2,
  Network,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Zap,
} from "@/components/icons";
import { MarketingFooter } from "@/components/brand/MarketingFooter";
import { MarketingNav } from "@/components/brand/MarketingNav";
import { AmbientOrbs } from "@/components/AmbientOrbs";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { ComparisonComposer } from "@/components/ComparisonComposer";
import TypewriterTitle from "@/components/kokonutui/type-writer";
import { ProductDemo } from "@/components/landing/ProductDemo";
import { ResearchPreviewCard } from "@/components/landing/ResearchPreviewCard";
import { useT, type MessageKey } from "@/i18n";

gsap.registerPlugin(ScrollTrigger);

const HERO_EXAMPLE_KEYS: MessageKey[] = ["home.type1", "home.type2", "home.type3", "home.type4", "home.type5", "home.type6"];

// The query text stays English on purpose: the research engine parses "X vs Y for Z".
const featuredComparisons: { label: string; category: MessageKey; sourceRequirement: MessageKey }[] = [
  { label: "iPhone 16 vs Google Pixel 9 for photography", category: "home.ex1.cat", sourceRequirement: "home.ex1.src" },
  { label: "LG C4 vs Samsung S90D for a bright living room", category: "home.ex2.cat", sourceRequirement: "home.ex2.src" },
  { label: "Tesla Model 3 vs BMW i4 for daily commuting", category: "home.ex3.cat", sourceRequirement: "home.ex3.src" },
  { label: "Portugal vs Spain for remote work", category: "home.ex4.cat", sourceRequirement: "home.ex4.src" },
  { label: "Notion vs Obsidian for personal notes", category: "home.ex5.cat", sourceRequirement: "home.ex5.src" },
  { label: "MIT vs Stanford for computer science", category: "home.ex6.cat", sourceRequirement: "home.ex6.src" },
];

const proofPoints: { value: MessageKey; label: MessageKey }[] = [
  { value: "home.proof1.value", label: "home.proof1.label" },
  { value: "home.proof2.value", label: "home.proof2.label" },
  { value: "home.proof3.value", label: "home.proof3.label" },
];

const methodSteps = [
  { icon: SearchCheck, number: "01", title: "home.step1.title" as MessageKey, body: "home.step1.body" as MessageKey },
  { icon: FileCheck2, number: "02", title: "home.step2.title" as MessageKey, body: "home.step2.body" as MessageKey },
  { icon: ChartNoAxesCombined, number: "03", title: "home.step3.title" as MessageKey, body: "home.step3.body" as MessageKey },
];

const valueStrip: { icon: typeof ShieldCheck; title: MessageKey; body: MessageKey }[] = [
  { icon: ShieldCheck, title: "home.value1.title", body: "home.value1.body" },
  { icon: Zap, title: "home.value2.title", body: "home.value2.body" },
  { icon: Network, title: "home.value3.title", body: "home.value3.body" },
];

const Index = () => {
  const t = useT();
  usePageTitle(t("home.pageTitle"));
  const heroExamples = useMemo(() => HERO_EXAMPLE_KEYS.map((key) => ({ text: t(key) })), [t]);
  const { session } = useAuth();
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Transform-only entrance choreography: content stays visible before JS runs and never causes layout shift
      const intro = gsap.timeline({ defaults: { ease: "power3.out", clearProps: "transform" } });
      intro
        .from(".hero-kicker", { y: 12, duration: 0.5 })
        .from(".hero-title > span > span", { yPercent: 28, stagger: 0.07, duration: 0.7 }, "-=0.35")
        .from(".hero-copy", { y: 14, duration: 0.55 }, "-=0.45")
        .from(".hero-proof", { y: 10, stagger: 0.06, duration: 0.4 }, "-=0.35")
        .from(".hero-composer", { y: 20, scale: 0.99, duration: 0.65 }, "-=0.5");

      gsap.utils.toArray<HTMLElement>(".reveal-section").forEach((section) => {
        ScrollTrigger.create({
          trigger: section,
          start: "top 88%",
          once: true,
          onEnter: () =>
            gsap.fromTo(
              section,
              { y: 24, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.65, ease: "power3.out", clearProps: "transform,opacity" },
            ),
        });
      });

      if (heroRef.current && window.matchMedia("(pointer: fine)").matches) {
        const glow = heroRef.current.querySelector<HTMLElement>(".hero-pointer-glow");
        if (glow) {
          const moveX = gsap.quickTo(glow, "x", { duration: 0.8, ease: "power3.out" });
          const moveY = gsap.quickTo(glow, "y", { duration: 0.8, ease: "power3.out" });
          const move = (event: PointerEvent) => {
            const rect = heroRef.current!.getBoundingClientRect();
            moveX(event.clientX - rect.left - rect.width / 2);
            moveY(event.clientY - rect.top - rect.height / 2);
          };
          heroRef.current.addEventListener("pointermove", move);
          return () => heroRef.current?.removeEventListener("pointermove", move);
        }
      }
    });

    return () => mm.revert();
  }, { scope: pageRef });

  const beginComparison = (query: string) => {
    const destination = `/app/comparisons?q=${encodeURIComponent(query)}`;
    navigate(session ? destination : `/auth/sign-in?redirect_url=${encodeURIComponent(destination)}`);
  };

  return (
    <div ref={pageRef} className="min-h-screen overflow-x-hidden bg-[#070605] text-white selection:bg-orange-400/30">
      <AmbientOrbs />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
      <MarketingNav />

      <main className="relative z-10">
        <section ref={heroRef} className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-16 lg:pt-20">
          <div className="hero-pointer-glow pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,.15),rgba(244,63,94,.06)_38%,transparent_68%)] blur-2xl" />
          <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-[minmax(0,.92fr)_minmax(500px,1.08fr)] lg:gap-x-14 lg:gap-y-0">
            <div className="text-center lg:col-start-1 lg:row-start-1 lg:text-left">
              <div className="hero-kicker mb-5 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/[0.08] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-200 shadow-[0_0_40px_rgba(249,115,22,.1)]">
                <Sparkles className="h-3.5 w-3.5" /> {t("home.kicker")}
              </div>
              <h1 className="hero-title font-serif text-[clamp(2.35rem,8.5vw,5.5rem)] leading-[1.0] tracking-[-0.04em] text-[#fffaf1] sm:leading-[0.92] sm:tracking-[-0.05em] lg:text-[5.6rem]">
                <span className="block overflow-hidden pb-2 sm:pb-1.5"><span className="block">{t("home.title1")}</span></span>
                <span className="block overflow-hidden pb-3 sm:pb-5 pr-2"><span className="block bg-gradient-to-r from-orange-300 via-rose-400 to-fuchsia-400 bg-clip-text pb-[0.14em] italic text-transparent">{t("home.title2")}</span></span>
              </h1>
              <p className="hero-copy mx-auto mt-5 max-w-xl text-base leading-7 text-white/75 sm:text-lg lg:mx-0">
                {t("home.lede")}
              </p>
              <p aria-hidden="true" className="mx-auto mt-4 flex min-h-7 max-w-xl items-baseline justify-center gap-2 text-sm text-white/55 lg:mx-0 lg:justify-start">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300/80">{t("home.try")}</span>
                <TypewriterTitle
                  as="span"
                  sequences={heroExamples}
                  typingSpeed={42}
                  deleteSpeed={22}
                  pauseBeforeDelete={1600}
                  deleteMode="select"
                  className="font-serif text-[#fffaf1]/90"
                  textClassName="text-xl leading-[1.3] sm:text-2xl"
                />
              </p>

            </div>

            <div id="start-comparing" className="min-w-0 scroll-mt-28 lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <ComparisonComposer
                onStart={beginComparison}
                className={`hero-composer mx-auto lg:mx-0 ${composerStyles.composerShell}`}
              />
            </div>

            <div className="text-center lg:col-start-1 lg:row-start-2 lg:text-left">
              <p className="mx-auto max-w-xl text-sm leading-6 text-white/65 lg:mx-0 lg:mt-3">
                {t("home.scope")}
              </p>

              <div className="mt-7 grid grid-cols-3 gap-2 sm:max-w-lg sm:gap-3 lg:mx-0">
                {proofPoints.map((point) => (
                  <div key={point.label} className="hero-proof rounded-2xl border border-white/[0.09] bg-white/[0.035] px-2.5 py-3 text-center backdrop-blur-sm sm:px-3.5 lg:text-left">
                    <p className="text-xs font-semibold text-white sm:text-sm">{t(point.value)}</p>
                    <p className="mt-1 text-[10px] leading-3.5 text-white/65 sm:text-[11px]">{t(point.label)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="reveal-section mt-14 border-t border-white/[0.08] pt-6 sm:mt-20 sm:pt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-300/90">{t("home.examples.kicker")}</p>
                <p className="mt-1 text-sm text-white/75">{t("home.examples.hint")}</p>
              </div>
              <ArrowRight className="hidden h-5 w-5 text-orange-300 sm:block" />
            </div>
            <div className="-mx-4 flex snap-x snap-mandatory overscroll-x-contain gap-3 overflow-x-auto px-4 pb-3 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-3">
              {featuredComparisons.map((comparison) => (
                <button
                  key={comparison.label}
                  type="button"
                  onClick={() => beginComparison(comparison.label)}
                  className="group relative min-h-[148px] w-[82vw] max-w-[330px] shrink-0 snap-center overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.035] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-orange-300/40 hover:bg-orange-400/[0.07] hover:shadow-[0_22px_55px_rgba(249,115,22,.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 active:translate-y-0 active:scale-[0.985] sm:w-auto sm:max-w-none"
                >
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-orange-400/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-300">{t(comparison.category)}</span>
                  </div>
                  <p className="mt-5 font-serif text-xl leading-snug text-[#fffaf1] transition-colors group-hover:text-white">{comparison.label}</p>
                  <div className="mt-4 flex items-center justify-between gap-3 text-xs text-white/65">
                    <span className="truncate">{t(comparison.sourceRequirement)}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-orange-300 transition-transform duration-300 group-hover:translate-x-1.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="reveal-section mx-auto mt-14 max-w-4xl sm:mt-20">
            <ProductDemo />
          </div>
        </section>

        <section className="reveal-section border-y border-white/[0.08] bg-white/[0.025]">
          <div className="mx-auto grid max-w-7xl gap-px px-4 py-6 sm:grid-cols-3 sm:px-6 sm:py-0">
            {valueStrip.map(({ icon: FeatureIcon, title, body }) => (
              <div key={title} className="flex gap-4 border-b border-white/[0.06] py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:border-white/[0.08] sm:px-6 sm:py-9 sm:last:border-r-0">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-orange-300/20 bg-orange-400/[0.08] text-orange-300"><FeatureIcon className="h-5 w-5" /></div>
                <div><h2 className="font-serif text-xl text-white">{t(title)}</h2><p className="mt-1 text-sm leading-6 text-white/70">{t(body)}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal-section mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:py-28">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[.82fr_1.18fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-300">{t("home.think.kicker")}</p>
              <h2 className="mt-4 max-w-md font-serif text-3xl leading-[1.08] tracking-tight text-[#fffaf1] sm:text-4xl lg:text-5xl">{t("home.think.title")}</h2>
              <p className="mt-5 max-w-md text-base leading-7 text-white/70">{t("home.think.body")}</p>

              <div className="mt-8 space-y-3">
                {methodSteps.map((step) => (
                  <article key={step.number} className="group grid gap-4 rounded-2xl border border-white/[0.09] bg-gradient-to-br from-white/[0.045] to-transparent p-4 transition duration-200 hover:border-orange-300/25 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-5">
                    <div className="grid h-12 w-12 place-items-center rounded-xl border border-white/[0.1] bg-black/35 text-orange-300"><step.icon className="h-5 w-5" /></div>
                    <div><h3 className="font-serif text-xl text-white">{t(step.title)}</h3><p className="mt-1.5 text-sm leading-6 text-white/70">{t(step.body)}</p></div>
                    <span className="font-mono text-xs text-white/50">{step.number}</span>
                  </article>
                ))}
              </div>
            </div>

            <div className="lg:pt-2">
              <ResearchPreviewCard />
            </div>
          </div>
        </section>

        <section className="reveal-section mx-4 mb-16 overflow-hidden rounded-[2rem] border border-orange-300/20 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,.18),transparent_38%),radial-gradient(circle_at_90%_80%,rgba(217,70,239,.13),transparent_42%),#100c0a] px-5 py-14 text-center shadow-[0_40px_120px_rgba(0,0,0,.45)] sm:mx-6 sm:py-20 lg:mx-auto lg:max-w-7xl">
          <CheckCircle2 className="mx-auto h-7 w-7 text-orange-300" />
          <h2 className="mx-auto mt-5 max-w-3xl font-serif text-3xl leading-[1.12] tracking-tight text-white sm:text-5xl sm:leading-none lg:text-6xl">{t("home.cta.title")}</h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/75">{t("home.cta.body")}</p>
          <Link to="/app/comparisons" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-[#130d09] transition duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 active:translate-y-0 active:scale-[0.99]">{t("home.cta.button")} <ArrowRight className="h-4 w-4" /></Link>
        </section>
      </main>

      <a className={snapCredit.badge} href="https://www.snapsolve.ink/">
        <span>{t("brand.madeBy")}</span>
        <span className={snapCredit.wordmark}>SnapSolve</span>
      </a>
      <MarketingFooter />
    </div>
  );
};

export default Index;
