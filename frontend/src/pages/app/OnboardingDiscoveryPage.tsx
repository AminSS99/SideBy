import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight,
  Check,
  Compass,
  Globe2,
  Layers3,
  MessageCircleMore,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { brand } from "@/config/brand";
import { useAuth } from "@/contexts/AuthContext";
import { captureEvent } from "@/lib/posthog";
import {
  readOnboardingAttribution,
  saveOnboardingAttribution,
  type DiscoverySource,
} from "@/lib/onboardingAttribution";
import { usePageTitle } from "@/hooks/usePageTitle";

const sources: Array<{
  id: DiscoverySource;
  title: string;
  description: string;
  icon: typeof Search;
}> = [
  { id: "search", title: "Search", description: "Google, Bing, or another search engine", icon: Search },
  { id: "social", title: "Social", description: "LinkedIn, X, YouTube, or another network", icon: Globe2 },
  { id: "friend", title: "A person", description: "A friend, teammate, or colleague", icon: Users },
  { id: "community", title: "Community", description: "Reddit, Slack, Discord, or a forum", icon: MessageCircleMore },
  { id: "product_directory", title: "Product directory", description: "A launch site, newsletter, or review directory", icon: Compass },
  { id: "snap_ecosystem", title: "Another Snap product", description: "You already use something in the Snap ecosystem", icon: Layers3 },
  { id: "other", title: "Something else", description: "Tell us in your own words", icon: Sparkles },
];

const OnboardingDiscoveryPage = () => {
  usePageTitle("How you found SideBy");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading } = useAuth();
  const pageRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<DiscoverySource | null>(null);
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isEditMode = searchParams.get("edit") === "1";

  useEffect(() => {
    if (!isEditMode || !user?.id) return;
    const saved = readOnboardingAttribution(user.id);
    if (!saved) return;
    setSelected(saved.source);
    setDetail(saved.detail ?? "");
  }, [isEditMode, user?.id]);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", () => {
        gsap.from(".discovery-option", { y: 22, scale: 0.97, duration: 0.65, stagger: 0.06, ease: "back.out(1.35)", clearProps: "transform" });
      });
      mm.add("(max-width: 767px)", () => {
        gsap.from(".discovery-option", { x: 18, duration: 0.5, stagger: 0.045, ease: "power3.out", clearProps: "transform" });
      });
      gsap.from(".discovery-heading", { y: 24, duration: 0.7, ease: "power3.out", clearProps: "transform" });
      return () => mm.revert();
    },
    { scope: pageRef },
  );

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#050505] text-sm text-white/50">Preparing your setup…</div>;
  }

  if (!user) return <Navigate to="/auth/sign-in" replace />;

  if (readOnboardingAttribution(user.id) && !isEditMode) return <Navigate to="/onboarding" replace />;

  const chooseSource = (source: DiscoverySource) => {
    setSelected(source);
    setError(null);
    if (source === "other") {
      window.requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
    }
  };

  const continueSetup = () => {
    if (!selected) {
      setError("Choose the closest answer to continue.");
      return;
    }
    if (selected === "other" && detail.trim().length < 2) {
      setError("Add a short note so we know where you found us.");
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const attribution = {
      source: selected,
      detail: detail.trim() || null,
      capturedAt: new Date().toISOString(),
    };
    saveOnboardingAttribution(user.id, attribution);
    captureEvent("onboarding_discovery_submitted", {
      discovery_source: attribution.source,
      has_detail: Boolean(attribution.detail),
    });
    navigate("/onboarding", { replace: true });
  };

  return (
    <div ref={pageRef} className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-5 text-white sm:px-6 sm:py-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_8%_8%,rgba(249,115,22,.13),transparent_28%),radial-gradient(circle_at_92%_82%,rgba(217,70,239,.09),transparent_34%),linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:auto,auto,52px_52px,52px_52px]" />

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <header className="mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/icon.svg" alt="SideBy" className="h-9 w-9 rounded-xl object-contain" />
            <div>
              <p className="font-serif text-lg leading-none text-[#fdfbf7]">{brand.productName}</p>
              <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.22em] text-white/35">Workspace setup</p>
            </div>
          </Link>
          <div className="flex items-center gap-3" aria-label="Step 1 of 3">
            <span className="hidden text-[9px] font-bold uppercase tracking-[0.2em] text-white/35 sm:block">Step 1 of 3</span>
            <div className="flex gap-1.5">
              <span className="h-1.5 w-7 rounded-full bg-gradient-to-r from-orange-500 to-amber-300" />
              <span className="h-1.5 w-7 rounded-full bg-white/10" />
              <span className="h-1.5 w-7 rounded-full bg-white/10" />
            </div>
          </div>
        </header>

        <main className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr] lg:gap-7">
          <section className="discovery-heading rounded-[28px] border border-white/10 bg-white/[0.035] p-6 sm:p-8 lg:sticky lg:top-8 lg:h-fit lg:p-10">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-orange-300">A quick hello</p>
            <h1 className="mt-4 font-serif text-4xl leading-[0.98] tracking-tight text-[#fdfbf7] sm:text-5xl">How did SideBy find its way to you?</h1>
            <p className="mt-5 text-sm leading-6 text-white/50">One tap helps us understand which communities and products introduce people to source-backed comparison.</p>
            <div className="mt-7 rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.055] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100"><Check className="h-4 w-4" /> This does not change your plan</div>
              <p className="mt-2 text-xs leading-5 text-white/42">It is used only for product analytics and onboarding improvement.</p>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-[#0b0a0a]/90 p-5 shadow-[0_30px_100px_-40px_rgba(249,115,22,.45)] sm:p-8 lg:p-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-orange-300">Choose one</p>
                <h2 className="mt-3 font-serif text-3xl text-[#fdfbf7]">The closest answer is perfect.</h2>
              </div>
              <span className="hidden text-xs text-white/30 sm:block">About 10 seconds</span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="How did you discover SideBy?">
              {sources.map((source) => {
                const Icon = source.icon;
                const active = selected === source.id;
                return (
                  <button
                    key={source.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => chooseSource(source.id)}
                    className={`discovery-option group flex min-h-[88px] items-start gap-3 rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${active ? "border-orange-300/45 bg-gradient-to-br from-orange-400/15 to-rose-400/[0.08]" : "border-white/[0.08] bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.045]"}`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${active ? "border-orange-300/30 bg-orange-400/15 text-orange-200" : "border-white/10 bg-black/20 text-white/45 group-hover:text-white"}`}><Icon className="h-4.5 w-4.5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-white">{source.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-white/38">{source.description}</span>
                    </span>
                    <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${active ? "border-orange-300 bg-orange-300 text-black" : "border-white/15 text-transparent"}`}><Check className="h-3 w-3" /></span>
                  </button>
                );
              })}
            </div>

            {selected === "other" && (
              <div ref={detailRef} className="mt-5">
                <label htmlFor="discovery-detail" className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/55">Where did you find us?</label>
                <input id="discovery-detail" value={detail} onChange={(event) => { setDetail(event.target.value); setError(null); }} placeholder="A podcast, event, newsletter…" autoFocus className="min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-[16px] text-white outline-none transition placeholder:text-white/25 focus:border-orange-300/50 focus:ring-4 focus:ring-orange-500/10" />
              </div>
            )}

            {error && <p role="alert" className="mt-4 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</p>}

            <button type="button" onClick={continueSetup} className="group mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-500 px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_16px_35px_-18px_rgba(244,63,94,.9)] transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-orange-300">
              Continue setup <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </section>
        </main>
      </div>
    </div>
  );
};

export default OnboardingDiscoveryPage;
