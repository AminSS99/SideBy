import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  GitCompareArrows,
  Grid2X2,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  Orbit,
  Radar,
  Sparkles,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { captureEvent } from "@/lib/posthog";

type EcosystemProduct = {
  slug: string;
  name: string;
  tagline: string | null;
  icon_url: string | null;
  launch_url: string | null;
  status: string;
  enabled: boolean;
};

type EcosystemSession = {
  workspace: { id: string; name: string; plan: string | null } | null;
  products: EcosystemProduct[];
};

type ProductView = EcosystemProduct & {
  fallbackIcon: typeof GitCompareArrows;
  accent: string;
};

const fallbackProducts: ProductView[] = [
  {
    slug: "sideby",
    name: "SideBy",
    tagline: "Source-backed comparisons and decision intelligence.",
    icon_url: "/icon.svg",
    launch_url: "/app/comparisons",
    status: "active",
    enabled: true,
    fallbackIcon: GitCompareArrows,
    accent: "from-orange-500/20 via-rose-500/10 to-transparent",
  },
  {
    slug: "orizonte",
    name: "Orizonte",
    tagline: "Available when your Snap workspace enables it.",
    icon_url: null,
    launch_url: null,
    status: "workspace_required",
    enabled: false,
    fallbackIcon: Radar,
    accent: "from-sky-500/20 via-cyan-500/10 to-transparent",
  },
  {
    slug: "rallia",
    name: "Rallia",
    tagline: "Available when your Snap workspace enables it.",
    icon_url: null,
    launch_url: null,
    status: "workspace_required",
    enabled: false,
    fallbackIcon: Orbit,
    accent: "from-violet-500/20 via-fuchsia-500/10 to-transparent",
  },
];

const productIcon = (slug: string) => {
  if (slug === "sideby") return GitCompareArrows;
  if (slug === "orizonte") return Radar;
  if (slug === "rallia") return Orbit;
  return Grid2X2;
};

const productAccent = (slug: string) => {
  if (slug === "sideby") return "from-orange-500/20 via-rose-500/10 to-transparent";
  if (slug === "orizonte") return "from-sky-500/20 via-cyan-500/10 to-transparent";
  if (slug === "rallia") return "from-violet-500/20 via-fuchsia-500/10 to-transparent";
  return "from-emerald-500/15 via-teal-500/10 to-transparent";
};

const EcosystemWorkspacePage = () => {
  usePageTitle("Snap workspace");
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [searchParams] = useSearchParams();
  const completedComparisonId = searchParams.get("comparison");
  const pageRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLElement>(null);
  const [session, setSession] = useState<EcosystemSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) {
      setIsLoading(false);
      return;
    }
    let active = true;
    apiFetch(buildApiUrl("/api/ecosystem/session"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
    }, { retries: 0 })
      .then((response) => response.json())
      .then((data: { session?: EcosystemSession | null }) => {
        if (active) setSession(data.session ?? null);
      })
      .catch(() => undefined)
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [user?.email]);

  const products = useMemo<ProductView[]>(() => {
    if (!session?.products?.length) return fallbackProducts;
    const resolved = session.products.map((product) => ({
      ...product,
      fallbackIcon: productIcon(product.slug),
      accent: productAccent(product.slug),
    }));
    if (!resolved.some((product) => product.slug === "sideby")) resolved.unshift(fallbackProducts[0]);
    return resolved;
  }, [session?.products]);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", () => {
        gsap.from(".ecosystem-hero-copy", { x: -34, duration: 0.8, ease: "power3.out", clearProps: "transform" });
        gsap.from(".ecosystem-orbit", { scale: 0.86, rotate: -8, duration: 1.05, ease: "back.out(1.3)", clearProps: "transform" });
      });
      mm.add("(max-width: 767px)", () => {
        gsap.from(".ecosystem-hero-copy", { y: 24, duration: 0.7, ease: "power3.out", clearProps: "transform" });
      });
      gsap.utils.toArray<HTMLElement>(".ecosystem-product").forEach((card, index) => {
        gsap.from(card, {
          y: 32,
          scale: 0.97,
          duration: 0.7,
          delay: index * 0.05,
          ease: "power3.out",
          clearProps: "transform",
          scrollTrigger: { trigger: card, start: "top 90%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: pageRef, dependencies: [products.length] },
  );

  const openProduct = (product: ProductView) => {
    captureEvent("ecosystem_product_opened", { product: product.slug, enabled: product.enabled });
  };

  return (
    <div ref={pageRef} className="space-y-8 sm:space-y-10">
      {completedComparisonId && (
        <section className="ecosystem-product flex flex-col gap-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
            <div>
              <p className="text-sm font-semibold text-emerald-100">Your first comparison is complete.</p>
              <p className="mt-1 text-xs leading-5 text-white/45">The result is saved in this workspace and remains available whenever you need the evidence.</p>
            </div>
          </div>
          <Link to={`/app/comparisons/${encodeURIComponent(completedComparisonId)}`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-emerald-200/20 px-5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-300/10">Review result <ArrowRight className="h-4 w-4" /></Link>
        </section>
      )}

      <section className="relative overflow-hidden rounded-[28px] border border-white/[0.09] bg-[radial-gradient(circle_at_85%_20%,rgba(217,70,239,.13),transparent_34%),radial-gradient(circle_at_20%_0%,rgba(249,115,22,.14),transparent_38%),rgba(255,255,255,.025)] p-5 sm:p-8 lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-10 lg:p-10">
        <div className="ecosystem-hero-copy relative z-10">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300"><Layers3 className="h-4 w-4" /> Snap workspace</div>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-[0.98] tracking-tight text-[#fffaf1] sm:text-5xl lg:text-6xl">One workspace. Every product that helps you move forward.</h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-white/52 sm:text-base sm:leading-7">Your comparison is one part of a broader Snap workflow. Open enabled products from the same workspace and keep the decision trail connected.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-500 px-6 text-sm font-bold text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-orange-300">
              Explore products <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <Link to="/app/comparisons" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.035] px-6 text-sm font-semibold text-white transition hover:bg-white/[0.07]">
              New comparison <GitCompareArrows className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="ecosystem-orbit relative mx-auto mt-10 aspect-square w-full max-w-[320px] lg:mt-0" aria-hidden="true">
          <div className="absolute inset-[12%] rounded-full border border-white/10" />
          <div className="absolute inset-[28%] rounded-full border border-orange-300/20 bg-black/30 shadow-[0_0_70px_rgba(249,115,22,.12)]" />
          <div className="absolute inset-[38%] flex items-center justify-center rounded-3xl border border-orange-300/25 bg-orange-400/10"><img src="/icon.svg" alt="" className="h-14 w-14 rounded-2xl" /></div>
          <span className="absolute left-[4%] top-[42%] flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sky-200"><Radar className="h-5 w-5" /></span>
          <span className="absolute right-[5%] top-[22%] flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-violet-200"><Orbit className="h-5 w-5" /></span>
          <span className="absolute bottom-[7%] right-[27%] flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-200"><Sparkles className="h-5 w-5" /></span>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">Workspace</p>
          <p className="mt-2 truncate font-serif text-xl text-white">{session?.workspace?.name || activeWorkspace?.name || "SideBy workspace"}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">Connected products</p>
          <p className="mt-2 font-serif text-xl text-white">{products.filter((product) => product.enabled).length} enabled</p>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">Privacy</p>
          <p className="mt-2 flex items-center gap-2 font-serif text-xl text-white"><LockKeyhole className="h-4 w-4 text-emerald-300" /> Workspace scoped</p>
        </div>
      </section>

      <section ref={productsRef} className="scroll-mt-24">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300">Product constellation</p>
            <h2 className="mt-2 font-serif text-3xl text-[#fffaf1] sm:text-4xl">Continue across Snap</h2>
          </div>
          {isLoading && <LoaderCircle className="h-5 w-5 animate-spin text-white/35" aria-label="Loading ecosystem products" />}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {products.map((product) => {
            const Icon = product.fallbackIcon;
            const canOpen = Boolean(product.launch_url && (product.enabled || product.slug === "sideby"));
            const isExternal = Boolean(product.launch_url?.startsWith("http"));
            const content = (
              <>
                <div className={`absolute inset-0 bg-gradient-to-br ${product.accent}`} />
                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/12 bg-black/25 text-white/70">
                      {product.icon_url ? <img src={product.icon_url} alt="" className="h-full w-full object-cover" /> : <Icon className="h-5 w-5" />}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-[0.13em] ${product.enabled ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-black/20 text-white/35"}`}>
                      {product.enabled ? <CheckCircle2 className="h-3 w-3" /> : <LockKeyhole className="h-3 w-3" />}
                      {product.enabled ? "Enabled" : product.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <h3 className="mt-10 font-serif text-3xl text-white">{product.name}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-white/48">{product.tagline || "A product in your Snap workspace."}</p>
                  <span className={`mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold ${canOpen ? "text-orange-200" : "text-white/30"}`}>
                    {canOpen ? "Open product" : "Enable in Snap workspace"}
                    {canOpen ? (isExternal ? <ExternalLink className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />) : <LockKeyhole className="h-4 w-4" />}
                  </span>
                </div>
              </>
            );

            return canOpen ? (
              isExternal ? (
                <a key={product.slug} href={product.launch_url ?? undefined} target="_blank" rel="noopener noreferrer" onClick={() => openProduct(product)} className="ecosystem-product group relative min-h-[280px] overflow-hidden rounded-[24px] border border-white/[0.09] bg-white/[0.025] p-5 transition hover:-translate-y-1 hover:border-orange-300/25 focus:outline-none focus:ring-2 focus:ring-orange-300 sm:p-6">{content}</a>
              ) : (
                <Link key={product.slug} to={product.launch_url ?? "/app"} onClick={() => openProduct(product)} className="ecosystem-product group relative min-h-[280px] overflow-hidden rounded-[24px] border border-white/[0.09] bg-white/[0.025] p-5 transition hover:-translate-y-1 hover:border-orange-300/25 focus:outline-none focus:ring-2 focus:ring-orange-300 sm:p-6">{content}</Link>
              )
            ) : (
              <article key={product.slug} className="ecosystem-product relative min-h-[280px] overflow-hidden rounded-[24px] border border-white/[0.07] bg-white/[0.018] p-5 sm:p-6">{content}</article>
            );
          })}
        </div>
      </section>

      {!session?.workspace && !isLoading && (
        <div className="flex flex-col gap-4 rounded-2xl border border-sky-300/15 bg-sky-400/[0.055] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-sm font-semibold text-sky-100">Snap workspace connection is not available in this environment.</p>
            <p className="mt-1 text-xs leading-5 text-white/42">SideBy remains fully usable. Additional products activate when the ecosystem bridge returns an enabled workspace session.</p>
          </div>
          <Link to="/contact" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-sky-200/20 px-5 text-xs font-semibold text-sky-100 hover:bg-sky-300/10">Ask about access</Link>
        </div>
      )}
    </div>
  );
};

export default EcosystemWorkspacePage;
