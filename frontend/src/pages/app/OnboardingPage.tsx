import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  Layers3, 
  Sparkles, 
  CheckCircle2,
  AlertCircle 
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { brand } from "@/config/brand";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";

const OnboardingPage = () => {
  usePageTitle("Welcome");
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [step, setStep] = React.useState<"welcome" | "create" | "creating">("welcome");
  const [workspaceName, setWorkspaceName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".ob-hero", { y: 30, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".ob-card", { y: 20, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }, "-=0.4");
  }, { scope: containerRef });

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
          slug: workspaceName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create workspace.");
      }

      toast.success("Workspace created!", {
        description: "Redirecting to your dashboard...",
      });

      // Give toast a moment to show, then navigate
      setTimeout(() => {
        navigate("/app", { replace: true });
        // Force a full reload to refresh workspace context
        window.location.reload();
      }, 800);
    } catch (err) {
      setStep("create");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
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

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-orange-600/[0.03] blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="ob-hero text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Private Beta</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-[#fdfbf7] tracking-tight">
            Welcome, {user?.fullName?.split(" ")[0] || user?.email?.split("@")[0] || "Researcher"}
          </h1>
          <p className="mt-4 text-sm text-[#fdfbf7]/50 max-w-md mx-auto leading-relaxed">
            Let's set up your first workspace so you can start creating source-backed comparisons.
          </p>
        </div>

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
                <h2 className="font-serif text-xl text-[#fdfbf7]">Create Workspace</h2>
                <p className="text-xs text-[#fdfbf7]/40">This is where your comparisons live</p>
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
            <h2 className="font-serif text-xl text-[#fdfbf7] mb-2">Setting up your workspace</h2>
            <p className="text-sm text-[#fdfbf7]/50">Just a moment while we prepare everything...</p>
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
