import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  Orbit,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MarketingNav } from "@/components/brand/MarketingNav";
import { MarketingFooter } from "@/components/brand/MarketingFooter";
import { usePageTitle } from "@/hooks/usePageTitle";
import { brand } from "@/config/brand";

const TIERS = [
  {
    id: "flow",
    name: "Flow",
    price: "Free",
    status: "Available now",
    description: "Start with one active SnapSolve product and the essentials for everyday decisions.",
    features: ["5 SideBy comparisons per day", "1 active ecosystem product", "Up to 3 team members", "Source-backed verdicts and exports"],
    cta: "Get started free",
    href: "/auth/sign-up",
    external: false,
    icon: Zap,
  },
  {
    id: "pulse",
    name: "Pulse",
    price: "$9",
    suffix: "/month",
    status: "Most popular",
    description: "The active paid tier for using more of the SnapSolve suite from one subscription.",
    features: ["Everything in Flow", "Unlimited AI analyses", "Up to 5 active products", "3 workspaces and up to 15 team members", "+500 SnapPoints subscription bonus"],
    cta: "Start Pulse",
    href: brand.billingUrl,
    external: true,
    featured: true,
    icon: Sparkles,
  },
  {
    id: "core",
    name: "Core",
    price: "$19",
    suffix: "/month",
    status: "Invite only",
    description: "Advanced intelligence, cross-product identity, and early access for power users.",
    features: ["Everything in Pulse", "Multi-account intelligence", "AI simulation and anomaly detection", "Cross-product identity and API access", "+750 SnapPoints subscription bonus"],
    cta: "Join Core waitlist",
    href: brand.billingUrl,
    external: true,
    icon: ShieldCheck,
  },
  {
    id: "orbit",
    name: "Orbit",
    price: "$39",
    suffix: "/month",
    status: "Future release",
    description: "One subscription across SideBy and the complete SnapSolve product ecosystem.",
    features: ["Everything in Core", "Future SideBy premium access", "Shared AI credits and intelligence", "Unified ecosystem identity and workspace", "Centralized billing for all SnapSolve apps"],
    cta: "Reserve Orbit access",
    href: brand.billingUrl,
    external: true,
    icon: Orbit,
  },
] as const;

const FAQS = [
  { question: "Is SideBy billed separately?", answer: "No. SideBy is part of the SnapSolve ecosystem. Your Flow, Pulse, Core, or Orbit tier is shared across the products enabled in your SnapSolve workspace." },
  { question: "Can I use SideBy without a card?", answer: "Yes. Flow requires no payment details and currently includes five SideBy comparison runs each day." },
  { question: "Which paid plans are available?", answer: "Pulse checkout is active. Core is invite-only, and Orbit is the future full-ecosystem subscription. Availability is managed centrally in SnapSolve Cockpit." },
  { question: "What counts as a comparison?", answer: "A completed research job comparing two options counts as one run. Follow-up questions and exports have separate usage limits." },
] as const;

const Pricing = () => {
  usePageTitle("Pricing");
  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.timeline()
      .from(".pricing-header", { y: 24, duration: 0.7, ease: "power3.out" })
      .from(".pricing-control", { y: 16, duration: 0.5, ease: "power2.out" }, "-=0.35")
      .from(".pricing-card", { y: 28, stagger: 0.1, duration: 0.65, ease: "power3.out" }, "-=0.25");
  }, { scope: pageRef });

  return (
    <div ref={pageRef} className="relative min-h-screen overflow-hidden bg-[#070605] text-[#fdfbf7] selection:bg-orange-500/30">
      <div className="pointer-events-none fixed inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
      <div className="pointer-events-none absolute -left-40 top-32 h-[420px] w-[420px] rounded-full bg-orange-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-48 top-[32rem] h-[480px] w-[480px] rounded-full bg-fuchsia-500/[0.08] blur-[140px]" />
      <MarketingNav />

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 sm:pb-28 sm:pt-20">
        <header className="pricing-header mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/[0.08] px-3.5 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-orange-200">
            <CircleDollarSign className="h-3.5 w-3.5" /> One SnapSolve subscription
          </div>
          <h1 className="mt-6 font-serif text-5xl leading-[0.94] tracking-[-0.04em] text-[#fffaf1] sm:text-7xl">
            One account. <span className="bg-gradient-to-r from-orange-300 via-rose-300 to-fuchsia-300 bg-clip-text italic text-transparent">One shared plan.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/50 sm:text-lg">
            SideBy is part of the SnapSolve ecosystem. Flow, Pulse, Core, and Orbit are managed once in SnapSolve Cockpit and shared across the products your workspace can access.
          </p>
        </header>

        <div className="pricing-control mx-auto mt-8 flex max-w-xl items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.15em] text-white/45 sm:mt-10">
          Monthly billing · Annual billing is coming soon · Managed centrally by SnapSolve
        </div>

        <section className="mx-auto mt-10 grid max-w-7xl gap-4 md:grid-cols-2 lg:mt-14 xl:grid-cols-4 xl:items-stretch">
          {TIERS.map((tier) => {
            const ctaClass = `group mt-7 flex min-h-[52px] items-center justify-center gap-2 rounded-2xl px-5 text-center text-[10px] font-bold uppercase tracking-[0.16em] transition hover:brightness-110 ${tier.featured ? "bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-500 text-white" : "border border-white/10 bg-white/[0.04] text-white/70"}`;
            return (
              <article key={tier.id} className={`pricing-card relative flex flex-col overflow-hidden rounded-[28px] border p-5 sm:p-7 ${tier.featured ? "border-orange-300/25 bg-gradient-to-br from-orange-500/[0.13] via-rose-500/[0.06] to-fuchsia-500/[0.07] shadow-[0_28px_80px_-40px_rgba(244,63,94,.75)]" : "border-white/[0.09] bg-white/[0.035]"}`}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/60 to-transparent" />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-orange-300"><tier.icon className="h-5 w-5" /></div>
                  <span className={`rounded-full border px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.16em] ${tier.id === "flow" ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300" : "border-orange-300/20 bg-orange-400/[0.08] text-orange-200"}`}>{tier.status}</span>
                </div>
                <div className="mt-6">
                  <h2 className="font-serif text-3xl text-white">{tier.name}</h2>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-white/45">{tier.description}</p>
                </div>
                <div className="mt-6 flex items-end gap-1.5">
                  <span className="font-serif text-5xl tracking-tight text-white">{tier.price}</span>
                  {"suffix" in tier && <span className="mb-1.5 text-sm text-white/35">{tier.suffix}</span>}
                </div>
                <div className="my-6 h-px bg-white/[0.08]" />
                <ul className="flex-1 space-y-3.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-white/65"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /><span>{feature}</span></li>
                  ))}
                </ul>
                {tier.external ? (
                  <a href={tier.href} className={ctaClass}>
                    {tier.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                ) : (
                  <Link to={tier.href} className={ctaClass}>
                    {tier.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                )}
              </article>
            );
          })}
        </section>

        <section className="mx-auto mt-8 grid max-w-6xl grid-cols-3 gap-2 sm:mt-10 sm:gap-4">
          {[[ShieldCheck, "One account", "Shared identity"], [Zap, "One bill", "Central billing"], [Orbit, "Five products", "Snap ecosystem"]].map(([Icon, value, label]) => {
            const TrustIcon = Icon as typeof ShieldCheck;
            return <div key={value as string} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 text-center sm:p-5"><TrustIcon className="mx-auto h-4 w-4 text-orange-300" /><p className="mt-2 text-xs font-semibold text-white sm:text-sm">{value as string}</p><p className="mt-1 text-[8px] uppercase tracking-wider text-white/30 sm:text-[9px]">{label as string}</p></div>;
          })}
        </section>

        <section className="mx-auto mt-20 max-w-3xl sm:mt-28">
          <div className="text-center"><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-orange-300">Straight answers</p><h2 className="mt-3 font-serif text-4xl text-white sm:text-5xl">Before you choose.</h2></div>
          <div className="mt-8 space-y-3">
            {FAQS.map((faq) => <details key={faq.question} className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"><summary className="cursor-pointer list-none text-sm font-semibold text-white marker:hidden">{faq.question}<span className="float-right text-orange-300 transition-transform group-open:rotate-45">+</span></summary><p className="mt-3 pr-6 text-sm leading-6 text-white/45">{faq.answer}</p></details>)}
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
};

export default Pricing;
