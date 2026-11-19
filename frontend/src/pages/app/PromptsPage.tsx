import React, { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Terminal, Plus, Search, Play, Copy, Edit3, Trash2, X, Save, Variable } from "@/components/icons";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { copyText } from "@/lib/clipboard";
import { GlowCard } from "@/components/GlowCard";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useProjects } from "@/contexts/ProjectsContext";
import { formatDate, useI18n, useT } from "@/i18n";

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  variables: string[];
  lastEdited: string;
}

const searchStringCache = new WeakMap<PromptTemplate, string>();

// Helper to extract variables from prompt content e.g. {{my_var}}
const extractVariables = (text: string): string[] => {
  const matches = text.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];
  // Remove brackets and duplicates
  return Array.from(new Set(matches.map(m => m.replace(/[{}]/g, '').trim())));
};

const PromptsPage = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const { activeProject } = useProjects();
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tl = gsap.timeline({ defaults: { clearProps: "transform,opacity" } });
    tl.from(".prompt-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".prompt-controls", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.6");

    if (containerRef.current?.querySelector(".prompt-card")) {
      tl.from(".prompt-card", { y: 20, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }, "-=0.4");
    }
  }, { scope: containerRef });

  const loadPrompts = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const query = activeWorkspace?.id ? `?workspaceId=${encodeURIComponent(activeWorkspace.id)}` : "";
      const response = await apiFetch(buildApiUrl(`/api/prompts${query}`), { signal });
      const data = (await response.json()) as {
        prompts: Array<{
          id: string;
          name: string;
          description: string;
          systemPrompt: string;
          variablesSchema: Record<string, unknown>;
          updatedAt: string;
        }>;
      };
      if (signal?.aborted) return;
      setPrompts(data.prompts.map((prompt) => ({
        id: prompt.id,
        name: prompt.name,
        description: prompt.description,
        content: prompt.systemPrompt,
        variables: Array.isArray(prompt.variablesSchema?.variables)
          ? prompt.variablesSchema.variables as string[]
          : extractVariables(prompt.systemPrompt),
        lastEdited: prompt.updatedAt,
      })));
    } catch (error) {
      if (signal?.aborted || (error instanceof Error && error.name === "AbortError")) {
        return;
      }
      const message = error instanceof Error ? error.message : t("wsp.common.tryAgainShortly");
      setLoadError(message);
      setPrompts([]);
      toast.error(t("wsp.prompts.loadError"), {
        description: message,
      });
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [activeWorkspace?.id, t]);

  useEffect(() => {
    const controller = new AbortController();
    void loadPrompts(controller.signal);
    return () => controller.abort();
  }, [loadPrompts, activeProject?.id]);

  const filteredPrompts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return prompts;

    return prompts.filter((p) => {
      let searchString = searchStringCache.get(p);
      if (searchString === undefined) {
        searchString = `${p.name} ${p.description}`.toLowerCase();
        searchStringCache.set(p, searchString);
      }
      return searchString.includes(term);
    });
  }, [prompts, search]);

  const copyToClipboard = async (text: string) => {
    const ok = await copyText(text);
    if (ok) {
      toast.success(t("wsp.prompts.copied"));
    } else {
      toast.error(t("wsp.prompts.copyBlocked"));
    }
  };

  const handleOpenEditor = (prompt?: PromptTemplate) => {
    if (prompt) {
      setEditingPrompt(prompt);
    } else {
      setEditingPrompt({
        id: crypto.randomUUID(),
        name: "",
        description: "",
        content: "",
        variables: [],
        lastEdited: new Date().toISOString(),
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const prompt = prompts.find((item) => item.id === id);
    if (!window.confirm(t("wsp.prompts.deleteConfirm", { name: prompt?.name ?? t("wsp.prompts.untitled") }))) return;
    const res = await apiFetch(buildApiUrl(`/api/prompts?id=${id}`), { method: "DELETE" });
    if (!res.ok) throw new Error(t("wsp.prompts.deleteFailMsg"));
    setPrompts(prev => prev.filter(p => p.id !== id));
    toast.success(t("wsp.prompts.deleted"));
  };

  const handleSave = async (savedPrompt: PromptTemplate) => {
    const exists = prompts.some(p => p.id === savedPrompt.id);
    const response = await apiFetch(buildApiUrl("/api/prompts"), {
      method: exists ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: exists ? savedPrompt.id : undefined,
        workspaceId: activeWorkspace?.id,
        name: savedPrompt.name,
        description: savedPrompt.description,
        systemPrompt: savedPrompt.content,
        variablesSchema: { variables: savedPrompt.variables },
      }),
    });
    const data = (await response.json()) as {
      prompt: { id: string; updatedAt: string };
    };

    setPrompts(prev => {
      const exists = prev.some(p => p.id === savedPrompt.id);
      if (exists) {
        return prev.map(p => p.id === savedPrompt.id ? { ...savedPrompt, id: data.prompt.id, lastEdited: data.prompt.updatedAt } : p);
      } else {
        return [{ ...savedPrompt, id: data.prompt.id, lastEdited: data.prompt.updatedAt }, ...prev];
      }
    });
    setIsModalOpen(false);
    toast.success(t("wsp.prompts.saved"));
  };

  return (
    <div ref={containerRef} className="space-y-8">
      <div className="prompt-header flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            {t("wsp.prompts.kicker")}
          </p>
          <h1 className="mt-3 font-serif text-4xl text-[#fdfbf7] tracking-tight">
            {t("wsp.prompts.title")}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#fdfbf7]/60">
            {t("wsp.prompts.subtitle")}
          </p>
        </div>
        <button 
          onClick={() => handleOpenEditor()}
          className="flex h-10 items-center justify-center gap-2 rounded-sm bg-[#fdfbf7] px-6 text-[10px] font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#e0e0e0] shrink-0"
        >
          <Plus className="h-4 w-4" />
          {t("wsp.prompts.newPrompt")}
        </button>
      </div>

      <div className="prompt-controls flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#fdfbf7]/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("wsp.prompts.searchPlaceholder")}
            className="h-12 w-full rounded-sm border border-[#333] bg-[#0c0b0a] pl-11 pr-4 text-sm text-[#fdfbf7] outline-none transition-colors placeholder:text-[#fdfbf7]/30 focus:border-orange-500"
          />
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="flex flex-col gap-4 rounded-sm border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-400 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-bold">{t("wsp.prompts.loadError")}</p>
            <p className="mt-1 text-xs text-amber-300/80">{loadError}</p>
          </div>
          <button
            type="button"
            onClick={() => void loadPrompts()}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-sm border border-amber-500/40 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-amber-500/20"
          >
            {t("cmp.retry")}
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {filteredPrompts.map((prompt) => (
          <GlowCard 
            key={prompt.id} 
            containerClassName="prompt-card group h-full" 
            className="flex flex-col h-full"
            glowColor="rgba(16, 185, 129, 0.15)"
          >
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Terminal className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-[#fdfbf7]">{prompt.name}</h3>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/30 mt-1">
                      {t("wsp.prompts.editedOn", { date: formatDate(prompt.lastEdited, lang) })}
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-[#fdfbf7]/60 mb-6 line-clamp-2">
                {prompt.description}
              </p>

              <div className="rounded-sm bg-[#0c0b0a] border border-[#2a2a2a] p-4 relative group group/code flex-1">
                <code className="text-xs text-[#fdfbf7]/80 font-mono block whitespace-pre-wrap">
                  {prompt.content}
                </code>
                <button 
                  type="button"
                  onClick={() => copyToClipboard(prompt.content)}
                  aria-label={t("wsp.prompts.copyAria")}
                  className="absolute top-2 right-2 inline-flex min-h-11 min-w-11 items-center justify-center p-1.5 rounded-sm bg-[#1a1a1a] border border-[#333] text-[#fdfbf7]/50 opacity-0 group-hover/code:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity hover:text-[#fdfbf7]"
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              {prompt.variables.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {prompt.variables.map(v => (
                    <span key={v} className="inline-flex items-center rounded-sm border border-[#333] bg-[#0c0b0a] px-2 py-1 text-[9px] font-mono text-[#fdfbf7]/50">
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-[#2a2a2a] bg-[#0c0b0a] p-3 flex justify-between items-center px-6 mt-auto">
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => handleOpenEditor(prompt)}
                  aria-label={t("wsp.prompts.editAria")}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center p-2 text-[#fdfbf7]/40 hover:text-emerald-400 focus-visible:opacity-100 group-focus-within:opacity-100 transition-colors"
                >
                  <Edit3 className="h-4 w-4" aria-hidden="true" />
                </button>
                <button 
                  type="button"
                  onClick={() => void handleDelete(prompt.id).catch((error) => toast.error(t("wsp.prompts.deleteFail"), { description: error instanceof Error ? error.message : t("wsp.common.tryAgainShortly") }))}
                  aria-label={t("wsp.prompts.deleteAria")}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center p-2 text-[#fdfbf7]/40 hover:text-red-400 focus-visible:opacity-100 group-focus-within:opacity-100 transition-colors"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/app/chat?prompt=${encodeURIComponent(prompt.content)}`)}
                className="flex min-h-11 items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/70 hover:text-white transition-colors"
              >
                <Play className="h-3 w-3" aria-hidden="true" />
                {t("wsp.prompts.testPrompt")}
              </button>
            </div>
          </GlowCard>
        ))}
        
        {filteredPrompts.length === 0 && !loadError && !isLoading && (
          <div className="col-span-full py-16 text-center border border-dashed border-[#333] bg-[#0c0b0a] rounded-sm">
            <Terminal className="mx-auto h-8 w-8 text-[#fdfbf7]/20 mb-4" aria-hidden="true" />
            <p className="text-[#fdfbf7]/50 text-sm">{t("wsp.prompts.empty")}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && editingPrompt && (
          <PromptEditorModal 
            prompt={editingPrompt} 
            onClose={() => setIsModalOpen(false)} 
            onSave={(prompt) => void handleSave(prompt).catch((error) => toast.error(t("wsp.prompts.saveFail"), { description: error instanceof Error ? error.message : t("wsp.common.tryAgainShortly") }))} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Extracted Editor Modal Component
const PromptEditorModal = ({ 
  prompt, 
  onClose, 
  onSave 
}: { 
  prompt: PromptTemplate, 
  onClose: () => void, 
  onSave: (p: PromptTemplate) => void 
}) => {
  const t = useT();
  const [formData, setFormData] = useState(prompt);
  
  // Real-time variable extraction
  const detectedVariables = useMemo(() => extractVariables(formData.content), [formData.content]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.content) {
      toast.error(t("wsp.prompts.nameContentRequired"));
      return;
    }
    onSave({
      ...formData,
      variables: detectedVariables,
    });
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-editor-modal-title"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-3xl rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between border-b border-[#2a2a2a] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Terminal className="h-4 w-4" aria-hidden="true" />
            </div>
            <h2 id="prompt-editor-modal-title" className="font-serif text-xl text-[#fdfbf7]">
              {prompt.name ? t("wsp.prompts.editTitle") : t("wsp.prompts.createTitle")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("wsp.prompts.closeAria")}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm p-2 text-[#fdfbf7]/40 transition-colors hover:bg-[#1a1a1a] hover:text-[#fdfbf7]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60">
                {t("wsp.prompts.nameLabel")}
              </label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("wsp.prompts.namePlaceholder")}
                className="w-full rounded-sm border border-[#333] bg-[#111] px-4 py-3 text-sm text-[#fdfbf7] outline-none transition-colors focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60">
                {t("wsp.prompts.descLabel")}
              </label>
              <input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("wsp.prompts.descPlaceholder")}
                className="w-full rounded-sm border border-[#333] bg-[#111] px-4 py-3 text-sm text-[#fdfbf7] outline-none transition-colors focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60">
                {t("wsp.prompts.contentLabel")}
              </label>
              <span className="text-[10px] text-[#fdfbf7]/40 font-mono">{t("wsp.prompts.variableHint")}</span>
            </div>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder={t("wsp.prompts.contentPlaceholder")}
              className="min-h-[200px] w-full resize-y rounded-sm border border-[#333] bg-[#111] p-4 font-mono text-sm text-[#fdfbf7] outline-none transition-colors focus:border-emerald-500"
            />
          </div>

          <div className="rounded-sm border border-[#2a2a2a] bg-[#111]/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Variable className="h-4 w-4 text-emerald-400" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/80">{t("wsp.prompts.detectedVars")}</h4>
            </div>
            {detectedVariables.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {detectedVariables.map(v => (
                  <span key={v} className="inline-flex items-center rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-mono font-bold text-emerald-400">
                    {v}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#fdfbf7]/40 italic">{t("wsp.prompts.noVars")}</p>
            )}
          </div>
        </form>

        <div className="border-t border-[#2a2a2a] p-6 flex justify-end gap-3 bg-[#080808]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[#fdfbf7]/60 transition-colors hover:bg-[#1a1a1a] hover:text-[#fdfbf7]"
          >
            {t("wsp.common.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 rounded-sm bg-[#fdfbf7] px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0]"
          >
            <Save className="h-4 w-4" />
            {t("wsp.prompts.savePrompt")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PromptsPage;
