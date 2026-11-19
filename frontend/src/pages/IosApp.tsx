import { Fragment, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { toast } from "sonner";
import { MarketingNav } from "@/components/brand/MarketingNav";
import { MarketingFooter } from "@/components/brand/MarketingFooter";
import { usePageTitle } from "@/hooks/usePageTitle";
import { captureEvent } from "@/lib/posthog";
import { useT, type MessageKey } from "@/i18n";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Download,
  Share,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from "@/components/icons";

const PREVIEW_COMPARISONS: readonly {
  id: string;
  query: string;
  winner: string;
  confidence: number;
  sources: number;
  summary: MessageKey;
  scores: readonly { label: MessageKey; a: number; b: number }[];
}[] = [
  {
    id: "linear-jira",
    query: "Linear vs Jira",
    winner: "Linear",
    confidence: 92,
    sources: 14,
    summary: "mobile.ios.preview.linearJira.summary",
    scores: [
      { label: "mobile.ios.preview.linearJira.dim1", a: 96, b: 64 },
      { label: "mobile.ios.preview.linearJira.dim2", a: 78, b: 94 },
      { label: "mobile.ios.preview.linearJira.dim3", a: 95, b: 72 },
    ],
  },
  {
    id: "react-vue",
    query: "React vs Vue",
    winner: "React",
    confidence: 89,
    sources: 18,
    summary: "mobile.ios.preview.reactVue.summary",
    scores: [
      { label: "mobile.ios.preview.reactVue.dim1", a: 97, b: 82 },
      { label: "mobile.ios.preview.reactVue.dim2", a: 76, b: 93 },
      { label: "mobile.ios.preview.reactVue.dim3", a: 84, b: 91 },
    ],
  },
];

const MILESTONES: { icon: typeof Zap; title: MessageKey; description: MessageKey; status: MessageKey }[] = [
  {
    icon: Zap,
    title: "mkt.ios.m1.title",
    description: "mkt.ios.m1.body",
    status: "mkt.ios.m1.status",
  },
  {
    icon: Bell,
    title: "mkt.ios.m2.title",
    description: "mkt.ios.m2.body",
    status: "mkt.ios.m2.status",
  },
  {
    icon: Share,
    title: "mkt.ios.m3.title",
    description: "mkt.ios.m3.body",
    status: "mkt.ios.m3.status",
  },
];

/** Swap `{name}` tokens in a translated sentence for styled nodes, keeping the word order of each language. */
const withParts = (template: string, parts: Record<string, ReactNode>) =>
  template.split(/(\{\w+\})/).map((piece, index) => {
    const match = /^\{(\w+)\}$/.exec(piece);
    return match && match[1] in parts ? <Fragment key={index}>{parts[match[1]]}</Fragment> : piece;
  });

export default function IosApp() {
  const t = useT();
  usePageTitle(t("mkt.ios.pageTitle"));
  const containerRef = useRef<HTMLDivElement>(null);
  const [activePreview, setActivePreview] = useState(0);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const preview = PREVIEW_COMPARISONS[activePreview];

  useGSAP(
    () => {
      if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "power3.out", duration: 0.7, clearProps: "transform,opacity" },
      });

      tl.from(".ios-hero-stagger", {
        y: 22,
        opacity: 0,
        stagger: 0.08,
      })
        .from(
          ".ios-phone-frame",
          {
            y: 28,
            scale: 0.96,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.45",
        )
        .from(
          ".ios-milestone-card",
          {
            y: 18,
            opacity: 0,
            stagger: 0.1,
          },
          "-=0.4",
        );
    },
    { scope: containerRef },
  );

  const handleWaitlistSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      toast.error(t("mkt.ios.invalidEmail"));
      return;
    }
    try {
      localStorage.setItem("sideby.ios_waitlist_email", trimmed);
    } catch {
      // ignore storage errors
    }
    captureEvent("ios_waitlist_joined", { domain: trimmed.split("@")[1] || "unknown" });
    setSubmitted(true);
    toast.success(t("mkt.ios.joinedToast"));
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#070605] text-[#fffaf1]">
      <MarketingNav />

      <main className="relative overflow-hidden">
        {/* Warm editorial ambient glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[780px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.16)_0%,rgba(244,63,94,0.08)_42%,transparent_72%)] blur-3xl"
        />

        <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            {/* Left column: editorial story & waitlist */}
            <div>
              <div className="ios-hero-stagger inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-500/10 px-3.5 py-1.5 text-xs font-medium tracking-wide text-orange-200">
                <Smartphone className="h-3.5 w-3.5 text-orange-300" />
                <span>{t("mkt.ios.badge")}</span>
              </div>

              <h1 className="ios-hero-stagger mt-6 font-serif text-4xl leading-[1.06] tracking-[-0.03em] text-[#fffaf1] sm:text-6xl">
                {t("mkt.ios.heroTitle")}{" "}
                <span className="bg-gradient-to-r from-orange-300 via-amber-200 to-rose-300 bg-clip-text text-transparent">
                  {t("mkt.ios.heroAccent")}
                </span>
              </h1>

              <p className="ios-hero-stagger mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
                {t("mkt.ios.heroBody")}
              </p>

              {/* Notify me / early access */}
              <div className="ios-hero-stagger mt-8 max-w-md rounded-2xl border border-white/[0.09] bg-white/[0.03] p-4 backdrop-blur-md">
                {submitted ? (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <div>
                      <p className="text-sm font-semibold text-[#fffaf1]">
                        {t("mkt.ios.joinedTitle")}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/65">
                        {withParts(t("mkt.ios.joinedBody"), {
                          email: <span className="text-orange-200">{email}</span>,
                        })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlistSubmit} className="flex flex-col gap-2.5 sm:flex-row">
                    <label htmlFor="ios-waitlist-email" className="sr-only">
                      {t("mkt.ios.waitlistLabel")}
                    </label>
                    <input
                      id="ios-waitlist-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("mkt.ios.waitlistPlaceholder")}
                      className="min-h-11 flex-1 rounded-xl border border-white/[0.12] bg-black/40 px-3.5 text-sm text-white placeholder:text-white/40 focus:border-orange-400/60 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(249,115,22,0.28)] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                    >
                      <span>{t("mkt.ios.notify")}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>

              <div className="ios-hero-stagger mt-5 flex flex-wrap items-center gap-4 text-xs text-white/60">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-orange-300" />
                  {t("mkt.ios.syncs")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-orange-300" />
                  {t("mkt.ios.pwaToday")}
                </span>
              </div>
            </div>

            {/* Right column: crafted iPhone mockup */}
            <div className="ios-phone-frame flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[330px] rounded-[46px] border-[6px] border-white/[0.14] bg-[#0e0c0a] p-3 shadow-[0_32px_90px_rgba(0,0,0,0.75),0_0_50px_rgba(249,115,22,0.12)]">
                {/* Side highlights */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[40px] ring-1 ring-inset ring-white/[0.08]"
                />

                {/* Screen */}
                <div className="relative overflow-hidden rounded-[36px] bg-[#070605] px-4 pb-5 pt-3">
                  {/* Dynamic Island + Status bar */}
                  <div className="flex items-center justify-between text-[10px] font-semibold text-white/75">
                    <span>9:41</span>
                    <div className="h-5 w-24 rounded-full bg-black ring-1 ring-white/10" />
                    <span>5G</span>
                  </div>

                  {/* Mockup header + switcher */}
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-orange-300/80">
                        {t("mkt.ios.previewEyebrow")}
                      </p>
                      <h2 className="mt-0.5 font-serif text-lg text-[#fffaf1]">{preview.query}</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePreview((prev) => (prev + 1) % PREVIEW_COMPARISONS.length)}
                      className="rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[10px] font-medium text-white/80 transition-colors hover:border-orange-300/40 hover:text-white"
                    >
                      {t("mkt.ios.switch")}
                    </button>
                  </div>

                  {/* Push notification pill */}
                  <div className="mt-3 flex items-center gap-2 rounded-2xl border border-orange-400/20 bg-orange-500/10 px-3 py-2">
                    <Bell className="h-3.5 w-3.5 shrink-0 text-orange-300" />
                    <p className="truncate text-[11px] text-orange-100">
                      {t("mkt.ios.pushPill", { count: preview.sources })}
                    </p>
                  </div>

                  {/* Verdict card */}
                  <div className="mt-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-white/50">
                        {t("mkt.ios.topPick")}
                      </span>
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                        {t("mkt.ios.confidence", { value: preview.confidence })}
                      </span>
                    </div>
                    <p className="mt-1 font-serif text-xl text-[#fffaf1]">{preview.winner}</p>
                    <p className="mt-1 text-[11px] leading-4 text-white/65">{t(preview.summary)}</p>
                  </div>

                  {/* Dimension bars */}
                  <div className="mt-3 space-y-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5">
                    {preview.scores.map((row) => (
                      <div key={row.label}>
                        <div className="flex items-center justify-between text-[10px] text-white/75">
                          <span>{t(row.label)}</span>
                          <span className="tabular-nums text-orange-200">
                            {row.a} / {row.b}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-400 transition-[width] duration-300"
                            style={{ width: `${row.a}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Home bar */}
                  <div className="mx-auto mt-5 h-1 w-24 rounded-full bg-white/25" />
                </div>
              </div>
            </div>
          </div>

          {/* 3-pillar roadmap */}
          <div className="mt-16 grid gap-5 sm:mt-24 md:grid-cols-3">
            {MILESTONES.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="ios-milestone-card rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 transition-colors hover:border-orange-300/25"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-orange-400/20 bg-orange-500/10 text-orange-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-white/70">
                      {t(item.status)}
                    </span>
                  </div>
                  <h3 className="mt-4 font-serif text-xl text-[#fffaf1]">{t(item.title)}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/65">{t(item.description)}</p>
                </article>
              );
            })}
          </div>

          {/* Use SideBy on iPhone right now (PWA) */}
          <div className="mt-12 rounded-3xl border border-white/[0.09] bg-gradient-to-br from-white/[0.04] to-transparent p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
                  <Download className="h-4 w-4" />
                  <span>{t("mkt.ios.pwaEyebrow")}</span>
                </div>
                <h2 className="mt-2 font-serif text-2xl text-[#fffaf1] sm:text-3xl">
                  {t("mkt.ios.pwaTitle")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  {withParts(t("mkt.ios.pwaBody"), {
                    share: <strong className="text-white">{t("mkt.ios.pwaShare")}</strong>,
                    addToHome: <strong className="text-white">{t("mkt.ios.pwaAddToHome")}</strong>,
                  })}
                </p>
              </div>
              <Link
                to="/app"
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-orange-300/30 bg-orange-500/15 px-5 text-sm font-semibold text-orange-100 transition-colors hover:bg-orange-500/25"
              >
                <span>{t("mkt.ios.openWeb")}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
