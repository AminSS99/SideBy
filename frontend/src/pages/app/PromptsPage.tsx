import React, { useState, useRef, useMemo } from "react";
import { Terminal, Plus, Search, Play, Copy, Edit3, Trash2, X, Save, Variable } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { copyText } from "@/lib/clipboard";
import { GlowCard } from "@/components/GlowCard";

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  variables: string[];
  lastEdited: string;
}

const initialPrompts: PromptTemplate[] = [
  {
    id: "1",
    name: "Executive Summary",
    description: "Condenses detailed technical comparisons into business-focused executive summaries.",
    content: "Act as a CTO. Summarize the following technical comparison focusing only on cost, time-to-market, and security implications: {{comparison_data}}",
    variables: ["comparison_data"],
    lastEdited: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Tone: Highly Technical",
    description: "Forces the AI to use precise engineering terminology and ignore marketing fluff.",
    content: "You are a principal systems engineer. Rewrite this content to be highly technical. Remove all marketing language. Focus on architecture, latency, and system constraints: {{input}}",
    variables: ["input"],
    lastEdited: new Date(Date.now() - 86400000).toISOString(),
  }
];

// Helper to extract variables from prompt content e.g. {{my_var}}
const extractVariables = (text: string): string[] => {
  const matches = text.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];
  // Remove brackets and duplicates
  return Array.from(new Set(matches.map(m => m.replace(/[{}]/g, '').trim())));
};

const PromptsPage = () => {
  const [prompts, setPrompts] = useState<PromptTemplate[]>(initialPrompts);
  const [search, setSearch] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".prompt-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".prompt-controls", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.6")
      .from(".prompt-card", { y: 20, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }, "-=0.4");
  }, { scope: containerRef });

  const filteredPrompts = prompts.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  const copyToClipboard = async (text: string) => {
    const ok = await copyText(text);
    if (ok) {
      toast.success("Prompt copied to clipboard");
    } else {
      toast.error("Clipboard permission is blocked.");
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

  const handleDelete = (id: string) => {
    setPrompts(prev => prev.filter(p => p.id !== id));
    toast.success("Prompt deleted");
  };

  const handleSave = (savedPrompt: PromptTemplate) => {
    setPrompts(prev => {
      const exists = prev.some(p => p.id === savedPrompt.id);
      if (exists) {
        return prev.map(p => p.id === savedPrompt.id ? { ...savedPrompt, lastEdited: new Date().toISOString() } : p);
      } else {
        return [{ ...savedPrompt, lastEdited: new Date().toISOString() }, ...prev];
      }
    });
    setIsModalOpen(false);
    toast.success("Prompt saved successfully");
  };

  return (
    <div ref={containerRef} className="space-y-8">
      <div className="prompt-header flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            Generation Studio
          </p>
          <h1 className="mt-3 font-serif text-4xl text-[#fdfbf7] tracking-tight">
            Prompt Library
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#fdfbf7]/60">
            Manage reusable system prompts, workflow instructions, and contextual templates for your workspace.
          </p>
        </div>
        <button 
          onClick={() => handleOpenEditor()}
          className="flex h-10 items-center justify-center gap-2 rounded-sm bg-[#fdfbf7] px-6 text-[10px] font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#e0e0e0] shrink-0"
        >
          <Plus className="h-4 w-4" />
          New Prompt
        </button>
      </div>

      <div className="prompt-controls flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#fdfbf7]/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="h-12 w-full rounded-sm border border-[#333] bg-[#0c0b0a] pl-11 pr-4 text-sm text-[#fdfbf7] outline-none transition-colors placeholder:text-[#fdfbf7]/30 focus:border-orange-500"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {filteredPrompts.map((prompt) => (
          <GlowCard 
            key={prompt.id} 
            containerClassName="prompt-card h-full" 
            className="flex flex-col h-full"
            glowColor="rgba(16, 185, 129, 0.15)"
          >
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Terminal className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-[#fdfbf7]">{prompt.name}</h3>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/30 mt-1">
                      Edited {new Date(prompt.lastEdited).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-[#fdfbf7]/60 mb-6 line-clamp-2">
                {prompt.description}
              </p>

              <div className="rounded-sm bg-[#0c0b0a] border border-[#2a2a2a] p-4 relative group/code flex-1">
                <code className="text-xs text-[#fdfbf7]/80 font-mono block whitespace-pre-wrap">
                  {prompt.content}
                </code>
                <button 
                  onClick={() => copyToClipboard(prompt.content)}
                  className="absolute top-2 right-2 p-1.5 rounded-sm bg-[#1a1a1a] border border-[#333] text-[#fdfbf7]/50 opacity-0 group-hover/code:opacity-100 transition-opacity hover:text-[#fdfbf7]"
                >
                  <Copy className="h-3 w-3" />
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
                  onClick={() => handleOpenEditor(prompt)}
                  className="p-2 text-[#fdfbf7]/40 hover:text-emerald-400 transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDelete(prompt.id)}
                  className="p-2 text-[#fdfbf7]/40 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/70 hover:text-white transition-colors">
                <Play className="h-3 w-3" />
                Test Prompt
              </button>
            </div>
          </GlowCard>
        ))}
        
        {filteredPrompts.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-[#333] bg-[#0c0b0a] rounded-sm">
            <Terminal className="mx-auto h-8 w-8 text-[#fdfbf7]/20 mb-4" />
            <p className="text-[#fdfbf7]/50 text-sm">No prompts found matching your search.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && editingPrompt && (
          <PromptEditorModal 
            prompt={editingPrompt} 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleSave} 
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
  const [formData, setFormData] = useState(prompt);
  
  // Real-time variable extraction
  const detectedVariables = useMemo(() => extractVariables(formData.content), [formData.content]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.content) {
      toast.error("Name and Content are required");
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
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-3xl rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between border-b border-[#2a2a2a] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Terminal className="h-4 w-4" />
            </div>
            <h2 className="font-serif text-xl text-[#fdfbf7]">
              {prompt.name ? "Edit Prompt" : "Create New Prompt"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm p-2 text-[#fdfbf7]/40 transition-colors hover:bg-[#1a1a1a] hover:text-[#fdfbf7]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60">
                Prompt Name
              </label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Code Reviewer"
                className="w-full rounded-sm border border-[#333] bg-[#111] px-4 py-3 text-sm text-[#fdfbf7] outline-none transition-colors focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60">
                Description (Optional)
              </label>
              <input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What does this prompt do?"
                className="w-full rounded-sm border border-[#333] bg-[#111] px-4 py-3 text-sm text-[#fdfbf7] outline-none transition-colors focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60">
                System Prompt Content
              </label>
              <span className="text-[10px] text-[#fdfbf7]/40 font-mono">Use {'{{variable}}'} syntax</span>
            </div>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="You are a helpful assistant..."
              className="min-h-[200px] w-full resize-y rounded-sm border border-[#333] bg-[#111] p-4 font-mono text-sm text-[#fdfbf7] outline-none transition-colors focus:border-emerald-500"
            />
          </div>

          <div className="rounded-sm border border-[#2a2a2a] bg-[#111]/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Variable className="h-4 w-4 text-emerald-400" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/80">Detected Variables</h4>
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
              <p className="text-xs text-[#fdfbf7]/40 italic">No variables detected. Add them using {'{{variable_name}}'}</p>
            )}
          </div>
        </form>

        <div className="border-t border-[#2a2a2a] p-6 flex justify-end gap-3 bg-[#080808]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[#fdfbf7]/60 transition-colors hover:bg-[#1a1a1a] hover:text-[#fdfbf7]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 rounded-sm bg-[#fdfbf7] px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0]"
          >
            <Save className="h-4 w-4" />
            Save Prompt
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PromptsPage;
