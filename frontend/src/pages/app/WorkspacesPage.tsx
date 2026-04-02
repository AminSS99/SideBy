import React from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const WorkspacesPage = () => {
  const { workspaces, isLoading, error, refresh } = useWorkspace();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-400">
          Workspaces
        </p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-tight">
          Workspace model scaffolded
        </h1>
        <p className="mt-4 max-w-3xl text-white/60">
          This page now reads from Supabase and bootstraps your first owner
          workspace on demand.
        </p>
      </div>

      {error && (
        <div className="rounded-[28px] border border-amber-400/25 bg-amber-400/10 p-6 text-sm text-amber-100">
          <p>{error}</p>
          <button
            className="mt-4 rounded-full border border-amber-300/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors hover:bg-amber-300/10"
            onClick={() => void refresh()}
          >
            Retry workspace bootstrap
          </button>
        </div>
      )}

      {!error && isLoading && (
        <div className="rounded-[28px] border border-white/10 bg-black/30 p-6 text-white/60">
          Creating or loading your SideBy workspace...
        </div>
      )}

      {!error && !isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className="rounded-[28px] border border-white/10 bg-black/30 p-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {workspace.name}
                </h2>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  Owner
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                {`Plan: ${workspace.plan}. Slug: ${workspace.slug}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkspacesPage;
