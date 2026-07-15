import React from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Layers3,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Users,
  WandSparkles,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { brand } from "@/config/brand";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { readOnboardingAttribution } from "@/lib/onboardingAttribution";

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

const PRODUCT_LOGOS: Record<string, string> = {
  orizonte: "https://sideby.ink/orizonte.png",
  rallia: "https://sideby.ink/rallia.png",
  sideby: "/icon.svg",
};

const SETUP_BENEFITS = [
  { id: "research", icon: SearchCheck, title: "Source-backed answers", description: "Every useful claim stays attached to evidence." },
  { id: "decisions", icon: WandSparkles, title: "Decision-ready output", description: "Turn messy research into a clear recommendation." },
  { id: "team", icon: Users, title: "One shared workspace", description: "Keep comparisons, projects, and collaborators together." },
] as const;

const slugify = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const getProductLogo = (product: EcosystemProduct) => {
  if (product.icon_url && !product.icon_url.startsWith("/")) return product.icon_url;
  return PRODUCT_LOGOS[product.slug] || "/icon.svg";
};

const OnboardingPage = () => {
  usePageTitle("Welcome");
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { refresh: refreshWorkspaces } = useWorkspace();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [step, setStep] = React.useState<"welcome" | "create" | "creating">("welcome");
  const [workspaceName, setWorkspaceName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [ecosystemSession, setEcosystemSession] = React.useState<EcosystemSession | null>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.timeline()
        .from(".ob-hero", { y: 24, opacity: 0, duration: 0.7, ease: "power3.out" })
        .from([".ob-card", ".ob-stage"], { y: 18, opacity: 0, duration: 0.55, stagger: 0.08, ease: "power2.out" }, "-=0.4");
    },
    { scope: containerRef, dependencies: [step] },
  );

  React.useEffect(() => {
    if (!user?.email) return;
    let active = true;
    apiFetch(buildApiUrl("/api/ecosystem/session"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
    }, { retries: 0 })
      .then((response) => response.json())
      .then((data: { session?: EcosystemSession | null }) => {
        if (active && data.session?.workspace) setEcosystemSession(data.session);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [user?.email]);

  const createWorkspace = async (name: string, successMessage: string) => {
    setStep("creating");
    setError(null);
    try {
      await apiFetch(buildApiUrl("/api/workspaces"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: slugify(name) }),
      });
      toast.success(successMessage, { description: "Opening your first comparison..." });
      await refreshWorkspaces();
      navigate("/app/comparisons?first=1", { replace: true });
    } catch (creationError) {
      setStep("create");
      setError(creationError instanceof Error ? creationError.message : "Something went wrong.");
    }
  };

  const handleCreate = async () => {
    const name = workspaceName.trim();
    if (!name) {
      setError("Please enter a workspace name.");
      return;
    }
    await createWorkspace(name, "Workspace created!");
  };

  const handleUseEcosystemWorkspace = async () => {
    const name = ecosystemSession?.workspace?.name?.trim();
    if (!name) return;
    setWorkspaceName(name);
    await createWorkspace(name, "Workspace connected!");
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-white/40">{brand.productName}</p>
          <p className="mt-3 text-lg text-white/70">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  if (user && !readOnboardingAttribution(user.id)) {
    return <Navigate to="/onboarding/discovery" replace />;
  }

  const stepNumber = step === "welcome" ? 2 : 3;

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-5 text-white sm:px-6 sm:py-8 lg:flex lg:items-center">
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-[360px] w-[360px] rounded-full bg-orange-500/10 blur-[100px]" />
        <div className="absolute -right-40 bottom-0 h-[420px] w-[420px] rounded-full bg-fuchsia-600/[0.08] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <header className="ob-hero mb-8 flex items-center justify-between">
          <Link to="/" className="group flex items-center gap-3">
            <img src="/icon.svg" alt="SideBy" className="h-9 w-9 rounded-xl object-contain shadow-lg" />
            <div>
              <p className="font-serif text-lg leading-none text-[#fdfbf7]">{brand.productName}</p>
              <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.22em] text-white/35">Workspace setup</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-[9px] font-bold uppercase tracking-[0.2em] text-white/35 sm:block">Step {stepNumber} of 3</span>
            <div className="flex gap-1.5" aria-label={`Step ${stepNumber} of 3`}>
              <span className="h-1.5 w-7 rounded-full bg-gradient-to-r from-orange-500 to-amber-300" />
              <span className="h-1.5 w-7 rounded-full bg-gradient-to-r from-orange-500 to-rose-400" />
              <span className={`h-1.5 w-7 rounded-full transition-colors ${stepNumber === 2 ? "bg-white/10" : "bg-gradient-to-r from-rose-500 to-fuchsia-500"}`} />
            </div>
          </div>
        </header>

        <main className="grid items-stretch gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:gap-7">
          <section className="ob-hero order-2 relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] p-6 sm:p-8 lg:order-1 lg:p-10">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/70 to-transparent" />
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-orange-300" />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-orange-200">Private beta</span>
            </div>
            <h1 className="mt-6 font-serif text-4xl leading-[0.98] tracking-tight text-[#fdfbf7] sm:text-5xl">
              Your next decision, <span className="bg-gradient-to-r from-orange-300 via-rose-300 to-fuchsia-300 bg-clip-text text-transparent">made clearer.</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/50">
              Welcome, {user?.fullName?.split(" ")[0] || user?.email?.split("@")[0] || "Researcher"}. Set up one focused place for the comparisons your team needs to trust.
            </p>
            <div className="mt-7 grid gap-3">
              {SETUP_BENEFITS.map((benefit) => (
                <div key={benefit.id} className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-black/20 p-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-orange-300">
                    <benefit.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/90">{benefit.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-white/40">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="ob-card order-1 flex flex-col rounded-[28px] border border-white/10 bg-[#0b0a0a]/90 p-5 shadow-[0_30px_100px_-40px_rgba(249,115,22,0.45)] backdrop-blur-xl sm:p-8 lg:order-2 lg:p-10">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-orange-300">
                  {step === "welcome" ? "02 · Your research home" : "03 · Name your workspace"}
                </p>
                <h2 className="mt-3 font-serif text-3xl tracking-tight text-[#fdfbf7] sm:text-4xl">
                  {step === "welcome" ? "Ready in under a minute." : step === "creating" ? "Building your space." : "Make it feel like yours."}
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/45">
                  {step === "welcome" ? "No configuration maze. Create a workspace, launch a comparison, and SideBy handles the research trail." : step === "creating" ? "We’re connecting your workspace, projects, and research history now." : "Use your team, company, or project name. You can change it later."}
                </p>
              </div>
              <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-400/10 text-orange-300 sm:flex">
                {step === "welcome" ? <ShieldCheck className="h-5 w-5" /> : <Layers3 className="h-5 w-5" />}
              </div>
            </div>

            {ecosystemSession?.workspace && (
              <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.055] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-300">SnapSolve workspace found</p>
                    <h3 className="mt-2 font-serif text-2xl text-[#fdfbf7]">{ecosystemSession.workspace.name}</h3>
                  </div>
                  <button type="button" onClick={() => void handleUseEcosystemWorkspace()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#fdfbf7] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-transform hover:-translate-y-0.5">
                    Use in SideBy <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  {ecosystemSession.products.filter((product) => product.launch_url && product.status !== "coming_soon").slice(0, 6).map((product) => (
                    <a key={product.slug} href={product.launch_url ?? "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3 transition-colors hover:border-orange-400/40">
                      <img src={getProductLogo(product)} alt={`${product.name} logo`} className="h-9 w-9 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[#fdfbf7]">{product.name}</div>
                        <div className="truncate text-xs text-white/40">{product.enabled ? "Enabled" : (product.tagline ?? "SnapSolve product")}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {step === "welcome" && (
              <div className="ob-stage mt-auto">
                <div className="mb-6 grid grid-cols-3 gap-2">
                  {["Create", "Compare", "Decide"].map((item) => (
                    <div key={item} className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-2 py-3 text-center text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">{item}</div>
                  ))}
                </div>
                <button type="button" onClick={() => setStep("create")} className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-500 px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_16px_35px_-18px_rgba(244,63,94,0.9)] transition-transform hover:-translate-y-0.5">
                  Continue to workspace <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <p className="mt-3 text-center text-[10px] text-white/30">Free beta access · no card required</p>
              </div>
            )}

            {step === "create" && (
              <div className="ob-stage mt-auto">
                {error && (
                  <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                  </div>
                )}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="workspace-name" className="text-[10px] font-bold uppercase tracking-widest text-white/60">Workspace name</label>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-1 transition-colors focus-within:border-orange-400/60 focus-within:ring-4 focus-within:ring-orange-500/10">
                      <input id="workspace-name" value={workspaceName} onChange={(event) => { setWorkspaceName(event.target.value); setError(null); }} onKeyDown={(event) => { if (event.key === "Enter") void handleCreate(); }} placeholder="e.g. Product Research" autoFocus className="w-full rounded-xl bg-transparent px-4 py-3.5 text-base text-[#fdfbf7] outline-none placeholder:text-white/20" />
                    </div>
                    <div className="flex items-center gap-2 px-1 text-[10px] text-white/30">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{workspaceName.trim() ? `sideby.app/${slugify(workspaceName) || "workspace"}` : "You can rename this anytime"}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-[0.8fr_1.2fr] gap-3 pt-2">
                    <button type="button" onClick={() => setStep("welcome")} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white">Back</button>
                    <button type="button" onClick={() => void handleCreate()} className="group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-500 px-4 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white transition-transform hover:-translate-y-0.5">
                      Create workspace <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === "creating" && (
              <div className="ob-stage mt-auto rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6">
                <div className="mb-6 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full w-3/4 animate-pulse rounded-full bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-500" /></div>
                <div className="space-y-3">
                  {["Creating workspace", "Connecting research tools", "Preparing your dashboard"].map((item, index) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-white/60">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full ${index === 0 ? "bg-emerald-400/15 text-emerald-300" : "bg-white/[0.06] text-white/35"}`}>{index === 0 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>

        <footer className="mt-6 flex items-center justify-between px-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/25">
          <Link to="/" className="transition-colors hover:text-orange-300">&larr; Back home</Link>
          <Link to="/onboarding/discovery?edit=1" className="transition-colors hover:text-orange-300">Update discovery answer</Link>
        </footer>
      </div>
    </div>
  );
};

export default OnboardingPage;
