import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  Clock3,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MarketingNav } from "@/components/brand/MarketingNav";
import { BrandFooter } from "@/components/brand/BrandFooter";
import { usePageTitle } from "@/hooks/usePageTitle";

const TIERS = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: "$0",
    annualPrice: "$0",
    description: "For exploring SideBy and making everyday decisions with evidence.",
    features: ["5 comparisons each day", "Source-backed verdicts", "Public comparison links", "Markdown and JSON exports"],
    cta: "Start comparing",
    href: "/auth/sign-up",
    available: true,
    icon: Zap,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: "$29",
    annualPrice: "$24",
    description: "For researchers who need more runs, deeper context, and private work.",
    features: ["Unlimited comparisons", "Private comparison links", "Advanced document uploads", "Faster research orchestration", "No SideBy watermark"],
    cta: "Get beta access",
    href: "/auth/sign-up",
    available: false,
    featured: true,
    icon: Sparkles,
  },
  {
    id: "team",
    name: "Team",
    monthlyPrice: "$99",
    annualPrice: "$79",
    description: "For teams building a shared, reusable decision practice.",
    features: ["Everything in Pro", "Shared team workspaces", "Central knowledge base", "Team notes and watchlists", "Priority support"],
    cta: "Join the team beta",
    href: "/contact?plan=team",
    available: false,
    icon: Users,
  },
] as const;

const FAQS = [
  { question: "Can I use SideBy without a card?", answer: "Yes. The Free plan needs no payment details and includes five comparison runs each day." },
  { question: "Are Pro and Team available today?", answer: "They are in private beta. The prices shown are the planned launch prices; paid checkout is not enabled yet." },
  { question: "What counts as a comparison?", answer: "A completed research job comparing two options counts as one run. Follow-up questions and exports have separate usage limits." },
] as const;

const Pricing = () => {
  usePageTitle("Pricing");
  const pageRef = useRef<HTMLDivElement>(null);
  const [isAnnual, setIsAnnual] = useState(true);

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
            <CircleDollarSign className="h-3.5 w-3.5" /> Simple from day one
          </div>
          <h1 className="mt-6 font-serif text-5xl leading-[0.94] tracking-[-0.04em] text-[#fffaf1] sm:text-7xl">
            Start free. <span className="bg-gradient-to-r from-orange-300 via-rose-300 to-fuchsia-300 bg-clip-text italic text-transparent">Scale when it matters.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/50 sm:text-lg">
            Make five source-backed decisions every day for free. Paid plans are currently in private beta, with pricing shown transparently before launch.
          </p>
        </header>

        <div className="pricing-control mx-auto mt-8 flex max-w-sm flex-col items-center gap-3 sm:mt-10">
          <div className="grid w-full grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5" aria-label="Billing preview">
            <button type="button" aria-pressed={!isAnnual} onClick={() => setIsAnnual(false)} className={`min-h-11 rounded-xl text-[10px] font-bold uppercase tracking-[0.16em] transition-colors ${!isAnnual ? "bg-white text-black" : "text-white/45 hover:text-white"}`}>Monthly</button>
            <button type="button" aria-pressed={isAnnual} onClick={() => setIsAnnual(true)} className={`min-h-11 rounded-xl text-[10px] font-bold uppercase tracking-[0.16em] transition-colors ${isAnnual ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white" : "text-white/45 hover:text-white"}`}>Annual · save 20%</button>
          </div>
          <p className="flex items-center gap-1.5 text-[10px] text-white/30"><Clock3 className="h-3.5 w-3.5" /> Paid billing is a launch preview</p>
        </div>

        <section className="mx-auto mt-10 grid max-w-6xl gap-4 lg:mt-14 lg:grid-cols-3 lg:items-stretch">
          {TIERS.map((tier) => {
            const price = isAnnual ? tier.annualPrice : tier.monthlyPrice;
            return (
              <article key={tier.id} className={`pricing-card relative flex flex-col overflow-hidden rounded-[28px] border p-5 sm:p-7 ${tier.featured ? "border-orange-300/25 bg-gradient-to-br from-orange-500/[0.13] via-rose-500/[0.06] to-fuchsia-500/[0.07] shadow-[0_28px_80px_-40px_rgba(244,63,94,.75)]" : "border-white/[0.09] bg-white/[0.035]"}`}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/60 to-transparent" />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-orange-300"><tier.icon className="h-5 w-5" /></div>
                  <span className={`rounded-full border px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.16em] ${tier.available ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300" : "border-orange-300/20 bg-orange-400/[0.08] text-orange-200"}`}>{tier.available ? "Available now" : "Private beta"}</span>
                </div>
                <div className="mt-6">
                  <h2 className="font-serif text-3xl text-white">{tier.name}</h2>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-white/45">{tier.description}</p>
                </div>
                <div className="mt-6 flex items-end gap-1.5">
                  <span className="font-serif text-5xl tracking-tight text-white">{price}</span>
                  {tier.id !== "free" && <span className="mb-1.5 text-sm text-white/35">/month</span>}
                </div>
                {tier.id !== "free" && isAnnual && <p className="mt-1 text-[10px] text-white/30">per month, billed annually at launch</p>}
                <div className="my-6 h-px bg-white/[0.08]" />
                <ul className="flex-1 space-y-3.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-white/65"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /><span>{feature}</span></li>
                  ))}
                </ul>
                <Link to={tier.href} className={`group mt-7 flex min-h-[52px] items-center justify-center gap-2 rounded-2xl px-5 text-[10px] font-bold uppercase tracking-[0.16em] transition-transform hover:-translate-y-0.5 ${tier.featured ? "bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-500 text-white" : tier.available ? "bg-white text-black" : "border border-white/10 bg-white/[0.04] text-white/70"}`}>
                  {tier.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </article>
            );
          })}
        </section>

        <section className="mx-auto mt-8 grid max-w-6xl grid-cols-3 gap-2 sm:mt-10 sm:gap-4">
          {[[ShieldCheck, "No card", "Start free"], [Zap, "5 daily", "Comparison runs"], [Users, "Private beta", "Paid plans"]].map(([Icon, value, label]) => {
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

      <footer className="relative z-10 border-t border-white/[0.08] bg-black/25"><div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6"><BrandFooter /><div className="flex gap-5 text-[9px] font-bold uppercase tracking-widest text-white/35"><Link to="/legal/privacy">Privacy</Link><Link to="/legal/terms">Terms</Link></div></div></footer>
    </div>
  );
};

export default Pricing;
