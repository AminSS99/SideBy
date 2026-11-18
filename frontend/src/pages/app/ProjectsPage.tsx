import React, { useState, useRef } from "react";
import { FolderKanban, LoaderCircle, Plus } from "@/components/icons";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProjects } from "@/contexts/ProjectsContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { EmptyState } from "@/components/EmptyState";
import { GlowCard } from "@/components/GlowCard";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { formatDate, useI18n } from "@/i18n";

const ProjectsPage = () => {
  const { t, lang } = useI18n();
  const { activeWorkspace } = useWorkspace();
  const {
    projects,
    activeProject,
    createProject,
    error,
    isLoading,
    setActiveProjectId,
  } = useProjects();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tl = gsap.timeline({ defaults: { clearProps: "transform,opacity" } });
    tl.from(".proj-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".proj-form", { x: -20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.6")
      .from(".proj-list", { x: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.8");
  }, { scope: containerRef });

  const handleCreateProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      toast.error(t("wsp.projects.nameRequired"));
      return;
    }

    try {
      setIsSubmitting(true);
      const project = await createProject({
        name,
        description,
      });
      setName("");
      setDescription("");
      toast.success(t("wsp.projects.createdToast"), {
        description: t("wsp.projects.createdToastDesc", { name: project.name }),
      });
    } catch (creationError) {
      toast.error(t("wsp.projects.createFail"), {
        description:
          creationError instanceof Error
            ? creationError.message
            : t("wsp.projects.createFailDesc"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={containerRef} className="space-y-8">
      <div className="proj-header">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
          {t("app.nav.projects")}
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[#fdfbf7] tracking-tight">
          {t("wsp.projects.title")}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#fdfbf7]/60">
          {t("wsp.projects.subtitle")}
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[400px_1fr] items-start">
        <GlowCard
          containerClassName="proj-form sticky top-24"
          className="p-8"
          glowColor="rgba(16, 185, 129, 0.15)"
        >
          <form onSubmit={handleCreateProject}>
            <div className="mb-8 flex items-center gap-4 border-b border-[#2a2a2a] pb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-serif text-2xl text-[#fdfbf7]">{t("wsp.projects.createHeading")}</h2>
                <p className="mt-1 text-xs text-[#fdfbf7]/40">
                  {activeWorkspace
                    ? t("wsp.projects.insideWorkspace", { name: activeWorkspace.name })
                    : t("wsp.projects.loadWorkspaceFirst")}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60">
                  {t("wsp.projects.nameLabel")}
                </label>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t("wsp.projects.namePlaceholder")}
                  className="h-12 rounded-sm border-[#333] bg-[#0c0b0a] text-[#fdfbf7] focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                  disabled={!activeWorkspace || isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60">
                  {t("wsp.projects.descLabel")}
                </label>
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={t("wsp.projects.descPlaceholder")}
                  className="min-h-32 resize-none rounded-sm border-[#333] bg-[#0c0b0a] text-[#fdfbf7] focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                  disabled={!activeWorkspace || isSubmitting}
                />
              </div>

              <button
                type="submit"
                disabled={!activeWorkspace || isSubmitting}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-[#fdfbf7] text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    {t("wsp.projects.creating")}
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("wsp.projects.createHeading")}
                  </>
                )}
              </button>

              {error && (
                <p className="mt-4 border-l-2 border-amber-500 bg-amber-500/10 p-3 text-xs text-amber-400">
                  {error}
                </p>
              )}
            </div>
          </form>
        </GlowCard>

        <GlowCard containerClassName="proj-list" className="p-8">
          <div className="mb-8 flex items-center justify-between gap-4 border-b border-[#2a2a2a] pb-6">
            <div>
              <h2 className="font-serif text-2xl text-[#fdfbf7]">{t("wsp.projects.listHeading")}</h2>
              <p className="mt-2 text-sm text-[#fdfbf7]/50">
                {t("wsp.projects.listSubtitle")}
              </p>
            </div>
            <div className="rounded-sm border border-[#333] bg-[#0c0b0a] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60">
              {t("wsp.common.totalCount", { count: projects.length })}
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-12 text-center text-sm text-[#fdfbf7]/40 animate-pulse">
              {t("wsp.projects.loading")}
            </div>
          ) : projects.length === 0 ? (
            <EmptyState 
              icon={FolderKanban}
              title={t("wsp.projects.emptyTitle")}
              description={t("wsp.projects.emptyDesc")}
              glowColor="emerald"
            />
          ) : (
            <div className="space-y-4">
              {projects.map((project) => {
                const isActive = project.id === activeProject?.id;

                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setActiveProjectId(project.id)}
                    className={[
                      "w-full rounded-sm border p-6 text-left transition-all",
                      isActive
                        ? "border-emerald-500/50 bg-[#1a1c1a] shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                        : "border-[#2a2a2a] bg-[#0c0b0a] hover:border-[#444] hover:bg-[#151515]",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-serif text-xl text-[#fdfbf7] truncate">
                          {project.name}
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-[#fdfbf7]/60 line-clamp-2">
                          {project.description || t("wsp.projects.noDesc")}
                        </p>
                      </div>
                      <span
                        className={[
                          "shrink-0 rounded-sm border px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest",
                          isActive
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-[#333] bg-[#111] text-[#fdfbf7]/40",
                        ].join(" ")}
                      >
                        {isActive ? t("wsp.projects.active") : t("wsp.projects.available")}
                      </span>
                    </div>

                    <div className="mt-6 flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/30">
                      <span>{t("wsp.common.created")}</span>
                      <span className="h-1 w-1 rounded-full bg-[#444]" />
                      <span>{formatDate(project.createdAt, lang)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </GlowCard>
      </div>
    </div>
  );
};

export default ProjectsPage;