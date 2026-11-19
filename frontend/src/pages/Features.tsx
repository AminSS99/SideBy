import { useRef } from "react";
import InkOrbitFeatures from "@/components/ui/ink-orbit-features";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Database,
  FileSearch,
  GitCompareArrows,
  LockKeyhole,
  MessageCircleQuestion,
  RefreshCw,
  RotateCcw,
  Scale,
  Sparkles,
  Users,
} from "@/components/icons";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MarketingFooter } from "@/components/brand/MarketingFooter";
import { MarketingNav } from "@/components/brand/MarketingNav";
import { BentoSpotlight } from "@/components/kokonutui/bento-spotlight";
import { CardFlip } from "@/components/kokonutui/card-flip";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useT, type MessageKey } from "@/i18n";

const FEATURES = [
  { id: "research", icon: FileSearch, eyebrow: "mkt.features.f1.eyebrow", title: "mkt.features.f1.title", description: "mkt.features.f1.desc", proof: "mkt.features.f1.proof" },
  { id: "score", icon: Scale, eyebrow: "mkt.features.f2.eyebrow", title: "mkt.features.f2.title", description: "mkt.features.f2.desc", proof: "mkt.features.f2.proof" },
  { id: "knowledge", icon: Database, eyebrow: "mkt.features.f3.eyebrow", title: "mkt.features.f3.title", description: "mkt.features.f3.desc", proof: "mkt.features.f3.proof" },
  { id: "refresh", icon: RefreshCw, eyebrow: "mkt.features.f4.eyebrow", title: "mkt.features.f4.title", description: "mkt.features.f4.desc", proof: "mkt.features.f4.proof" },
  { id: "followup", icon: MessageCircleQuestion, eyebrow: "mkt.features.f5.eyebrow", title: "mkt.features.f5.title", description: "mkt.features.f5.desc", proof: "mkt.features.f5.proof" },
  { id: "team", icon: Users, eyebrow: "mkt.features.f6.eyebrow", title: "mkt.features.f6.title", description: "mkt.features.f6.desc", proof: "mkt.features.f6.proof" },
] as const;

const TRUST: [typeof LockKeyhole, MessageKey][] = [
  [LockKeyhole, "mkt.features.trust1"],
  [Database, "mkt.features.trust2"],
  [Scale, "mkt.features.trust3"],
];

const Features = () => {
  const t = useT();
  usePageTitle(t("mkt.features.pageTitle"));
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
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/[0.08] px-3.5 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-orange-200"><Sparkles className="h-3.5 w-3.5" /> {t("mkt.features.badge")}</div>
          <h1 className="mt-6 font-serif text-5xl leading-[0.94] tracking-[-0.04em] text-[#fffaf1] sm:text-7xl">
            {t("mkt.features.titleA")}{" "}<span className="bg-gradient-to-r from-orange-300 via-rose-300 to-fuchsia-300 bg-clip-text italic text-transparent">{t("mkt.features.titleAccent")}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/50 sm:text-lg">
            {t("mkt.features.body")}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/" className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-500 px-6 text-[10px] font-bold uppercase tracking-[0.16em] text-white transition hover:brightness-110">{t("mkt.features.ctaTry")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
            <Link to="/pricing" className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-6 text-[10px] font-bold uppercase tracking-[0.16em] text-white/65 transition-colors hover:bg-white/[0.07] hover:text-white">{t("mkt.features.ctaPricing")}</Link>
          </div>
        </header>

        <div className="feat-pipeline mx-auto mt-12 max-w-5xl sm:mt-16">
          <InkOrbitFeatures theme="dark" brand="SideBy" tag={t("mkt.features.pipelineTag")} />
        </div>

        <section className="mt-16 sm:mt-24">
          <div className="mb-7 max-w-2xl"><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-orange-300">{t("mkt.features.sectionEyebrow")}</p><h2 className="mt-3 font-serif text-4xl leading-tight text-white sm:text-5xl">{t("mkt.features.sectionTitle")}</h2><p className="mt-4 text-sm leading-6 text-white/45">{t("mkt.features.sectionBody")}</p></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <CardFlip
                key={feature.id}
                ariaLabel={t(feature.title)}
                className="feat-card h-full"
                front={
                  <BentoSpotlight
                    as="article"
                    tone="amber"
                    className="group h-full rounded-[28px] border-white/[0.09] bg-gradient-to-br from-white/[0.05] to-[#0c0b0a] hover:border-orange-300/25"
                    contentClassName="flex h-full flex-col p-5 sm:p-7"
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-300/15 bg-orange-400/[0.08] text-orange-300">
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/25">
                          {t(feature.eyebrow)}
                        </span>
                        <span
                          aria-hidden="true"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/35 transition-colors group-hover:border-orange-300/25 group-hover:text-orange-200"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                    <h3 className="mt-6 font-serif text-2xl leading-tight text-[#fffaf1]">
                      {t(feature.title)}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-6 text-white/45">
                      {t(feature.description)}
                    </p>
                    <p className="mt-6 border-t border-white/[0.07] pt-4 text-[9px] font-bold uppercase tracking-[0.14em] text-orange-200/60">
                      {t(feature.proof)}
                    </p>
                  </BentoSpotlight>
                }
                back={
                  <article className="flex h-full flex-col justify-between rounded-[28px] border border-orange-300/25 bg-[radial-gradient(circle_at_15%_0%,rgba(249,115,22,.18),transparent_48%),radial-gradient(circle_at_90%_100%,rgba(244,63,94,.12),transparent_48%),#0c0b0a] p-5 sm:p-7">
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-2 rounded-full border border-orange-300/25 bg-orange-500/10 px-3 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-orange-200">
                          <feature.icon className="h-3 w-3" />
                          {t(feature.eyebrow)}
                        </span>
                        <span
                          aria-hidden="true"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-orange-300/25 bg-orange-500/10 text-orange-200"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </span>
                      </div>
                      <h3 className="mt-5 font-serif text-2xl leading-tight text-[#fffaf1]">
                        {t(feature.title)}
                      </h3>
                      <div className="mt-4 rounded-2xl border border-orange-300/15 bg-black/35 p-4">
                        <p className="font-serif text-base leading-6 text-orange-100/90">
                          {t(feature.proof)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-5 text-xs leading-5 text-white/55">
                      {t(feature.description)}
                    </p>
                  </article>
                }
              />
            ))}
          </div>
        </section>

        <section className="relative mt-16 overflow-hidden rounded-[32px] border border-orange-300/15 bg-[radial-gradient(circle_at_15%_15%,rgba(249,115,22,.18),transparent_36%),radial-gradient(circle_at_90%_85%,rgba(217,70,239,.12),transparent_42%),#100c0a] p-6 text-center shadow-[0_35px_100px_-50px_rgba(249,115,22,.7)] sm:mt-24 sm:p-12">
          <GitCompareArrows className="mx-auto h-7 w-7 text-orange-300" />
          <h2 className="mx-auto mt-5 max-w-3xl font-serif text-4xl leading-tight text-white sm:text-6xl">{t("mkt.features.ctaFinalTitle")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/50 sm:text-base">{t("mkt.features.ctaFinalBody")}</p>
          <Link to="/auth/sign-up" className="group mt-7 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-white px-6 text-[10px] font-bold uppercase tracking-[0.16em] text-black transition hover:brightness-105">{t("mkt.features.ctaStart")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
        </section>

        <section className="mx-auto mt-12 grid max-w-4xl grid-cols-3 gap-2 sm:gap-4">
          {TRUST.map(([TrustIcon, label]) => (
            <BentoSpotlight
              key={label}
              tone="emerald"
              className="rounded-2xl border-white/[0.08] bg-white/[0.025]"
              contentClassName="p-3 text-center sm:p-5"
            >
              <TrustIcon className="mx-auto h-4 w-4 text-emerald-300" />
              <p className="mt-2 text-[8px] font-bold uppercase tracking-wider text-white/40 sm:text-[9px]">{t(label)}</p>
            </BentoSpotlight>
          ))}
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
};

export default Features;
