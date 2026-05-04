import React, { useRef } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Layers3, Settings2, LoaderCircle, AlertCircle } from "lucide-react";
import { GlowCard } from "@/components/GlowCard";

const WorkspacesPage = () => {
  const { workspaces, isLoading, error, refresh } = useWorkspace();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".ws-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".ws-card", { y: 20, opacity: 0, stagger: 0.15, duration: 0.8, ease: "power3.out" }, "-=0.6");
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="space-y-8">
      <div className="ws-header flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            Workspaces
          </p>
          <h1 className="mt-3 font-serif text-4xl text-[#fdfbf7] tracking-tight">
            Workspace model active
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#fdfbf7]/60">
            This page bootstraps your private beta workspace from Clerk session state.
          </p>
        </div>
      </div>

      {error && (
        <div className="ws-card rounded-sm border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-500 flex items-start gap-4">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p>{error}</p>
            <button
              className="mt-4 rounded-sm border border-amber-500/40 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-amber-500/20"
              onClick={() => void refresh()}
            >
              Retry workspace bootstrap
            </button>
          </div>
        </div>
      )}

      {!error && isLoading && (
        <div className="ws-card rounded-sm border border-[#2a2a2a] bg-[#111] p-12 text-center text-sm text-[#fdfbf7]/50 flex flex-col items-center gap-4">
          <LoaderCircle className="h-6 w-6 animate-spin text-orange-500" />
          Creating or loading your SideBy workspace...
        </div>
      )}

      {!error && !isLoading && (
        <div className="grid gap-6 md:grid-cols-2">
          {workspaces.map((workspace) => (
            <GlowCard
              key={workspace.id}
              containerClassName="ws-card group"
              className="p-8 flex flex-col h-full"
            >
              <div className="mb-6 flex items-center justify-between border-b border-[#2a2a2a] pb-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#1a1a1a] border border-[#333] text-[#fdfbf7]">
                    <Layers3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl text-[#fdfbf7] group-hover:text-orange-400 transition-colors">
                      {workspace.name}
                    </h2>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
                      {workspace.slug}
                    </p>
                  </div>
                </div>
                <span className="rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-emerald-400">
                  Owner
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 mb-1">Plan</p>
                  <p className="text-sm text-[#fdfbf7] capitalize">{workspace.plan}</p>
                </div>
                <div className="rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 mb-1">Created</p>
                  <p className="text-sm text-[#fdfbf7]">{new Date(workspace.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button className="flex items-center gap-2 rounded-sm bg-[#1a1a1a] border border-[#333] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/70 transition-colors hover:border-[#555] hover:text-[#fdfbf7]">
                  <Settings2 className="h-3.5 w-3.5" />
                  Manage
                </button>
              </div>
            </GlowCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkspacesPage;