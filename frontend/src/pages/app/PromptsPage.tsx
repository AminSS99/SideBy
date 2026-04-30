import React, { useState, useRef } from "react";
import { Terminal, Plus, Search, Play, Copy, Edit3, Trash2 } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { toast } from "sonner";

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

const PromptsPage = () => {
  const [prompts, setPrompts] = useState<PromptTemplate[]>(initialPrompts);
  const [search, setSearch] = useState("");
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Prompt copied to clipboard");
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
        <button className="flex h-10 items-center justify-center gap-2 rounded-sm bg-[#fdfbf7] px-6 text-[10px] font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#e0e0e0] shrink-0">
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
          <div key={prompt.id} className="prompt-card flex flex-col rounded-sm border border-[#2a2a2a] bg-[#111] overflow-hidden hover:border-[#444] transition-colors group">
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-orange-500/10 text-orange-400 border border-orange-500/20">
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

              <div className="rounded-sm bg-[#0c0b0a] border border-[#2a2a2a] p-4 relative group/code">
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

            <div className="border-t border-[#2a2a2a] bg-[#0c0b0a] p-3 flex justify-between items-center px-6">
              <div className="flex gap-2">
                <button className="p-2 text-[#fdfbf7]/40 hover:text-orange-400 transition-colors">
                  <Edit3 className="h-4 w-4" />
                </button>
                <button className="p-2 text-[#fdfbf7]/40 hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/70 hover:text-white transition-colors">
                <Play className="h-3 w-3" />
                Test Prompt
              </button>
            </div>
          </div>
        ))}
        
        {filteredPrompts.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-[#333] bg-[#0c0b0a] rounded-sm">
            <Terminal className="mx-auto h-8 w-8 text-[#fdfbf7]/20 mb-4" />
            <p className="text-[#fdfbf7]/50 text-sm">No prompts found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptsPage;