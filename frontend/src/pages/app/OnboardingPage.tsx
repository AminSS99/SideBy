import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Layers3,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
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
  workspace: {
    id: string;
    name: string;
    plan: string | null;
  } | null;
  products: EcosystemProduct[];
};

const PRODUCT_LOGOS: Record<string, string> = {
  orizonte: "https://snapsolve.ink/orizonte.png",
  rallia: "https://snapsolve.ink/rallia.png",
  sideby: "/sideby.ico",
};

const getProductLogo = (product: EcosystemProduct) => {
  if (product.icon_url && !product.icon_url.startsWith("/"))
    return product.icon_url;
  return PRODUCT_LOGOS[product.slug] || "/sideby.ico";
};

const OnboardingPage = () => {
  usePageTitle("Welcome");
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { refresh: refreshWorkspaces } = useWorkspace();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [step, setStep] = React.useState<"welcome" | "create" | "creating">(
    "welcome",
  );
  const [workspaceName, setWorkspaceName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [ecosystemSession, setEcosystemSession] =
    React.useState<EcosystemSession | null>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline();
      tl.from(".ob-hero", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      }).from(
        ".ob-card",
        { y: 20, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" },
        "-=0.4",
      );
    },
    { scope: containerRef },
  );

  React.useEffect(() => {
    if (!user?.email) return;

    let active = true;
    apiFetch(
      buildApiUrl("/api/ecosystem/session"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      },
      { retries: 0 },
    )
      .then((response) => response.json())
      .then((data: { session?: EcosystemSession | null }) => {
        if (active && data.session?.workspace) {
          setEcosystemSession(data.session);
        }
      })
      .catch(() => {
        // SnapSolve Core discovery is optional; local onboarding still works.
      });

    return () => {
      active = false;
    };
  }, [user?.email]);

  const handleCreate = async () => {
    if (!workspaceName.trim()) {
      setError("Please enter a workspace name.");
      return;
    }

    setStep("creating");
    setError(null);

    try {
      const res = await apiFetch(buildApiUrl("/api/workspaces"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workspaceName.trim(),
          slug: workspaceName
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
        }),
      });

      const data = (await res.json()) as { workspace?: { id: string } };

      toast.success("Workspace created!", {
        description: "Redirecting to your dashboard...",
      });

      await refreshWorkspaces();
      navigate("/app", { replace: true });
    } catch (err) {
      setStep("create");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const handleUseEcosystemWorkspace = async () => {
    const name = ecosystemSession?.workspace?.name?.trim();
    if (!name) return;

    setWorkspaceName(name);
    setStep("creating");
    setError(null);

    try {
      await apiFetch(buildApiUrl("/api/workspaces"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
        }),
      });

      toast.success("Workspace connected!", {
        description: "Redirecting to your SideBy dashboard...",
      });

      await refreshWorkspaces();
      navigate("/app", { replace: true });
    } catch (err) {
      setStep("welcome");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-white/40">
            {brand.productName}
          </p>
          <p className="mt-3 text-lg text-white/70">
            Preparing your workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4 py-12 relative overflow-hidden"
    >
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-orange-600/[0.03] blur-[60px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="ob-hero text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">
              Private Beta
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-[#fdfbf7] tracking-tight">
            Welcome,{" "}
            {user?.fullName?.split(" ")[0] ||
              user?.email?.split("@")[0] ||
              "Researcher"}
          </h1>
          <p className="mt-4 text-sm text-[#fdfbf7]/50 max-w-md mx-auto leading-relaxed">
            {ecosystemSession?.workspace
              ? "We found your SnapSolve workspace. You can jump into SideBy or any connected product."
              : "Let's set up your first workspace so you can start creating source-backed comparisons."}
          </p>
        </div>

        {ecosystemSession?.workspace && (
          <div className="ob-card mb-5 rounded-sm border border-emerald-500/20 bg-emerald-500/[0.055] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                  SnapSolve workspace found
                </p>
                <h2 className="mt-2 font-serif text-2xl text-[#fdfbf7]">
                  {ecosystemSession.workspace.name}
                </h2>
                <p className="mt-1 text-xs text-[#fdfbf7]/45">
                  Shared access, rewards, and product launches are managed from
                  Cockpit.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleUseEcosystemWorkspace()}
                className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#fdfbf7] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0]"
              >
                Use in SideBy
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {ecosystemSession.products
                .filter(
                  (product) =>
                    product.launch_url && product.status !== "coming_soon",
                )
                .slice(0, 6)
                .map((product) => (
                  <a
                    key={product.slug}
                    href={product.launch_url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-sm border border-[#fdfbf7]/10 bg-[#0c0b0a]/70 px-3 py-3 transition-colors hover:border-orange-400/40"
                  >
                    <img
                      src={getProductLogo(product)}
                      alt={`${product.name} logo`}
                      className="h-9 w-9 rounded-sm object-cover"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[#fdfbf7]">
                        {product.name}
                      </div>
                      <div className="truncate text-xs text-[#fdfbf7]/40">
                        {product.enabled
                          ? "Enabled"
                          : (product.tagline ?? "SnapSolve product")}
                      </div>
                    </div>
                  </a>
                ))}
            </div>
          </div>
        )}

        {step === "welcome" && (
          <div className="ob-card rounded-sm border border-[#2a2a2a] bg-[#111] p-8">
            <div className="space-y-4 mb-8">
              {[
                "Create unlimited comparisons with cited sources",
                "Organize research into workspaces and projects",
                "Export results to Markdown or JSON",
                "Invite team members to collaborate",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-[#fdfbf7]/70">{item}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep("create")}
              className="w-full flex items-center justify-center gap-2 rounded-sm bg-[#fdfbf7] px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0]"
            >
              Create Your Workspace
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === "create" && (
          <div className="ob-card rounded-sm border border-[#2a2a2a] bg-[#111] p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-orange-500/10 border border-orange-500/20 text-orange-400">
                <Layers3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-serif text-xl text-[#fdfbf7]">
                  Create Workspace
                </h2>
                <p className="text-xs text-[#fdfbf7]/40">
                  This is where your comparisons live
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-sm border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60">
                  Workspace Name
                </label>
                <input
                  value={workspaceName}
                  onChange={(e) => {
                    setWorkspaceName(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="e.g., Product Research, Engineering Team..."
                  autoFocus
                  className="w-full rounded-sm border border-[#333] bg-[#0c0b0a] px-4 py-3 text-sm text-[#fdfbf7] outline-none transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 placeholder:text-[#fdfbf7]/20"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("welcome")}
                  className="flex-1 rounded-sm border border-[#333] bg-[#0c0b0a] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60 transition-colors hover:border-[#555] hover:text-[#fdfbf7]"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-[2] flex items-center justify-center gap-2 rounded-sm bg-[#fdfbf7] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0]"
                >
                  Create Workspace
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "creating" && (
          <div className="ob-card rounded-sm border border-[#2a2a2a] bg-[#111] p-12 text-center">
            <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-2 border-[#333] border-t-orange-400" />
            <h2 className="font-serif text-xl text-[#fdfbf7] mb-2">
              Setting up your workspace
            </h2>
            <p className="text-sm text-[#fdfbf7]/50">
              Just a moment while we prepare everything...
            </p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/30 hover:text-orange-400 transition-colors"
          >
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
